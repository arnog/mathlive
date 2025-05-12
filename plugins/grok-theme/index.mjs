/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
import {
  DeclarationReflection,
  ReferenceReflection,
  ReferenceType,
  ReflectionKind,
  ReflectionType,
  ArrayType,
  UnionType,
  IntersectionType,
  i18n,
} from 'typedoc';

import { MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

/**
 *
 * THEORY OF OPERATION
 *
 * The partials below are based on the default partials provided by the
 * markdown theme. They are modified in some small ways, for example to omit
 * some labels, or to add a `<MemberCard>` component around certain types of
 * reflections.
 *
 * See @custom comments for changes.
 */

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  app.renderer.defineTheme('grok-theme', GrokTheme);
}

class GrokTheme extends MarkdownTheme {
  /**
   * @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page
   */
  getRenderContext(page) {
    return new GrokThemeRenderContext(this, page, this.application.options);
  }
}

/** Utility functions extracted from the MarkdownTheme plugin */
export function backTicks(text) {
  // If the input string itself contains a pipe, or backslash (which can result in unwanted side effects) the string is escaped instead.
  if (/(\||\\)/g.test(text)) {
    return escapeChars(text);
  }
  // If the input string itself contains a backtick, the string is wrapped in double backticks.
  if (/`/g.test(text)) {
    return `\`\` ${text} \`\``;
  }
  // Otherwise, the string is wrapped in single backticks.
  return `\`${text}\``;
}

class GrokThemeRenderContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options);
    const superPartials = this.partials;

    const superHasUsefulTypeDetails = this.helpers.hasUsefulTypeDetails;
    this.helpers = {
      ...this.helpers,
      hasUsefulTypeDetails: (type) => {
        // The asciiMath.delimiters property for some reason does not have a .visit property
        if (!type.visit) return false;
        return superHasUsefulTypeDetails(type);
      },
    };

    this.templates = {
      ...this.templates,
      /**
       * Template that maps to individual reflection models.
       */
      reflection: (page) => {
        const md = [];

        md.push(this.hook('page.begin', this).join('\n'));

        if (!this.options.getValue('hidePageHeader')) {
          md.push(this.partials.header());
        }

        if (!this.options.getValue('hideBreadcrumbs')) {
          md.push(this.partials.breadcrumbs());
        }

        if (!this.options.getValue('hidePageTitle')) {
          md.push(heading(1, this.partials.pageTitle()));
        }

        md.push(this.hook('content.begin', this).join('\n'));

        // @custom
        if (page.model.kind === ReflectionKind.Module) {
          md.push(
            this.partials.memberWithGroups(page.model, { headingLevel: 1 })
          );
        } else if (
          [
            // ReflectionKind.Module,   // @custom
            ReflectionKind.Namespace,
            ReflectionKind.Enum,
            ReflectionKind.Class,
            ReflectionKind.Interface,
          ].includes(page.model.kind)
        ) {
          md.push(
            this.partials.memberWithGroups(page.model, { headingLevel: 2 })
          );
        } else {
          md.push(
            this.partials.memberContainer(page.model, { headingLevel: 1 })
          );
        }

        md.push(this.partials.footer());

        md.push(this.hook('page.end', this).join('\n'));

        return md.join('\n\n');
      },
    };

    this.partials = {
      ...superPartials,

      // typedoc-plugin-markdown/src/theme/context/partials/container.body.ts
      body: (model, options) => {
        const md = [];

        if (model.kind === ReflectionKind.Module) {
          console.log('body ' + model.name + ' ' + model.kind);
        }

        if (model.categories?.length) {
          md.push(
            this.partials.categories(model.categories, {
              headingLevel: options.headingLevel,
            })
          );
        } else {
          const containerKinds = [
            ReflectionKind.Project,
            ReflectionKind.Module,
            ReflectionKind.Namespace,
          ];
          if (
            (this.options.getValue('excludeGroups') ||
              this.options.getValue('hideGroupHeadings')) &&
            containerKinds.includes(model.kind)
          ) {
            if (model.categories?.length) {
              md.push(
                this.partials.categories(model.categories, {
                  headingLevel: options.headingLevel,
                })
              );
            } else {
              if (model.groups?.length) {
                model.groups.sort(sortNoneSectionFirst).forEach((group, i) => {
                  if (
                    group.children.every((child) =>
                      this.router.hasOwnDocument(child)
                    )
                  ) {
                    if (!isNoneSection(group)) {
                      md.push(heading(options.headingLevel, group.title));
                    }
                    md.push(this.partials.groupIndex(group));
                  } else {
                    md.push(
                      this.partials.members(group.children, {
                        headingLevel: options.headingLevel,
                      })
                    );
                    if (model.groups && i < model.groups?.length - 1) {
                      md.push(horizontalRule());
                    }
                  }
                });
              }
            }
          } else {
            if (model.groups?.length) {
              md.push(
                this.partials.groups(model, {
                  headingLevel: options.headingLevel,
                  kind: model.kind,
                })
              );
            }
          }
        }

        return md.join('\n\n');
      },

      /**  Within a "container", all children grouped by their kind,
       * i.e. all the methods, all the properties, etc...
       *
       * From src/theme/context/partials/container.groups.ts
       *
       */
      groups: (model, options) => {
        const md = [];
        const getGroupTitle = (groupTitle) => {
          return groupTitle;
        };

        model.groups?.sort(sortNoneSectionFirst).forEach((group) => {
          if (
            group.title === i18n.kind_plural_module() ||
            group.children.every((child) => this.router.hasOwnDocument(child))
          ) {
            const isPackages =
              this.options.getValue('entryPointStrategy') === 'packages' &&
              this.getPackagesCount() > 1 &&
              group.title === i18n.kind_plural_module() &&
              model.kind === ReflectionKind.Project;
            // if (isPackages) {
            //   md.push(heading(options.headingLevel, i18n.theme_packages()));
            // } else {
            //   md.push(heading(options.headingLevel, group.title));
            // }
            if (group.description) {
              md.push(this.helpers.getCommentParts(group.description));
            }
            if (group.categories) {
              group.categories.forEach((categoryGroup) => {
                // md.push(heading(options.headingLevel + 1, categoryGroup.title));
                if (categoryGroup.description) {
                  md.push(
                    this.helpers.getCommentParts(categoryGroup.description)
                  );
                }
                md.push(this.partials.groupIndex(categoryGroup));
              });
            } else {
              if (isPackages) {
                md.push(this.partials.packagesIndex(model));
              } else {
                md.push(this.partials.groupIndex(group));
              }
            }
          } else {
            const isEventProps = getGroupTitle(group.title) === 'Events';
            if (group.categories) {
              // md.push(heading(options.headingLevel, getGroupTitle(group.title)));
              if (group.description) {
                md.push(this.helpers.getCommentParts(group.description));
              }
              md.push(
                this.partials.categories(group.categories, {
                  headingLevel: options.headingLevel + 1,
                })
              );
            } else {
              const isPropertiesGroup = group.children.every(
                (child) => child.kind === ReflectionKind.Property
              );

              const isEnumGroup = group.children.every(
                (child) => child.kind === ReflectionKind.EnumMember
              );

              // md.push(heading(options.headingLevel, getGroupTitle(group.title)));

              if (group.description) {
                md.push(this.helpers.getCommentParts(group.description));
              }
              if (
                isPropertiesGroup &&
                this.helpers.useTableFormat('properties', options.kind)
              ) {
                md.push(
                  this.partials.propertiesTable(group.children, {
                    isEventProps,
                  })
                );
              } else if (isEnumGroup && this.helpers.useTableFormat('enums')) {
                md.push(this.partials.enumMembersTable(group.children));
              } else {
                if (group.children) {
                  md.push(
                    this.partials.members(group.children, {
                      headingLevel: options.headingLevel + 1,
                      groupTitle: group.title,
                    })
                  );
                }
              }
            }
          }
        });
        return md.join('\n\n');
      },

      constructor: (model, options) => {
        const md = [];
        md.push(`<MemberCard>`);
        const memberName = `new ${model.parent.name}()`;
        md.push(heading(options.headingLevel, memberName));

        model.signatures?.forEach((signature) => {
          md.push(
            this.partials.signature(signature, {
              headingLevel: options.headingLevel + 1,
            })
          );
        });
        md.push(`</MemberCard>`);
        return md.join('\n\n');
      },

      // typeDeclaration -> typeDeclarationList -> memberContainer
      // Print the members (properties) of an object type literal
      memberContainer: (model, options) => {
        const md = []; // ['***memberContainer' + options.headingLevel];

        // Skip the anchor and title, `member()` will handle that @custom

        // if (
        //   !model.hasOwnDocument &&
        //   model.url &&
        //   this.options.getValue('useHTMLAnchors')
        // ) {
        //   md.push(`<a id="${model.anchor}"></a>`);
        // }

        // if (
        //   !model.hasOwnDocument &&
        //   ![ReflectionKind.Constructor].includes(model.kind)
        // ) {
        //   md.push(
        //     heading(options.headingLevel, this.partials.memberTitle(model)),
        //   );
        // }

        md.push(
          this.partials.member(model, {
            headingLevel: options.headingLevel,
            nested: options.nested,
          })
        );

        return md.join('\n\n');
      },

      // declaration -> typeDeclarationContainer -> typeDeclaration -> typeDeclarationList
      // For example, declaration of a struct with multiple fields
      declaration: (model, options) => {
        const md = []; // ['***declaration ' + options.nested];

        const opts = {
          nested: false,
          ...options,
        };

        md.push(this.partials.declarationTitle(model));

        if (
          !opts.nested &&
          model.sources &&
          !this.options.getValue('disableSources')
        ) {
          md.push(this.partials.sources(model));
        }

        if (model?.documents) {
          md.push(
            this.partials.documents(model, {
              headingLevel: options.headingLevel,
            })
          );
        }

        let typeDeclaration = model.type?.declaration;

        if (
          model.type instanceof ArrayType &&
          model.type?.elementType instanceof ReflectionType
        ) {
          typeDeclaration = model.type?.elementType?.declaration;
        }

        const hasTypeDeclaration =
          Boolean(typeDeclaration) ||
          (model.type instanceof UnionType &&
            model.type?.types.some((type) => type instanceof ReflectionType));

        if (model.comment) {
          md.push(
            this.partials.comment(model.comment, {
              headingLevel: opts.headingLevel,
              showSummary: true,
              showTags: false,
            })
          );
        }

        if (model.type instanceof IntersectionType) {
          model.type?.types?.forEach((intersectionType) => {
            if (
              intersectionType instanceof ReflectionType &&
              !intersectionType.declaration.signatures
            ) {
              if (intersectionType.declaration.children) {
                // md.push(
                //     heading(
                //       opts.headingLevel,
                //       i18n.theme_type_declaration(),
                //     ),
                // ); @custom

                // @custom
                if (model.type && this.helpers.hasUsefulTypeDetails(model.type))
                  md.push(
                    this.partials.typeDeclaration(
                      intersectionType.declaration,
                      {
                        headingLevel: opts.headingLevel,
                      }
                    )
                  );
              }
            }
          });
        }

        if (model.typeParameters) {
          md.push(heading(opts.headingLevel, i18n.theme_type_declaration()));
          if (this.helpers.useTableFormat('parameters')) {
            md.push(this.partials.typeParametersTable(model.typeParameters));
          } else {
            md.push(this.partials.typeParametersList(model.typeParameters));
          }
        }

        if (hasTypeDeclaration) {
          if (model.type instanceof UnionType) {
            if (this.helpers.hasUsefulTypeDetails(model.type)) {
              md.push(
                heading(opts.headingLevel, i18n.theme_type_declaration())
              );

              model.type.types.forEach((type) => {
                if (type instanceof ReflectionType) {
                  md.push(
                    this.partials.someType(type, { forceCollapse: true })
                  );
                  md.push(
                    this.partials.typeDeclarationContainer(
                      model,
                      type.declaration,
                      options
                    )
                  );
                } else {
                  md.push(`${this.partials.someType(type)}`);
                }
              });
            }
          } else {
            // const useHeading =
            //   typeDeclaration?.children?.length &&
            //   (model.kind !== ReflectionKind.Property ||
            //     this.helpers.useTableFormat('properties'));
            // // "### Type Declaration"
            // if (useHeading) {
            //   md.push(
            //     heading(opts.headingLevel, i18n.theme_type_declaration()),
            //   );
            // }
            if (model.type && this.helpers.hasUsefulTypeDetails(model.type))
              md.push(
                this.partials.typeDeclarationContainer(
                  model,
                  typeDeclaration,
                  options
                )
              );
          }
        }
        if (model.comment) {
          md.push(
            this.partials.comment(model.comment, {
              headingLevel: opts.headingLevel,
              showSummary: false,
              showTags: true,
              showReturns: true,
            })
          );
        }

        md.push(
          this.partials.inheritance(model, { headingLevel: opts.headingLevel })
        );

        return md.join('\n\n');
      },

      /** Used to indicate which super-class a class is derived from */
      inheritance: (model, options) => {
        return '';
        // const md = [];

        // if (model.implementationOf) {
        //   if (options.headingLevel !== -1) {
        //     md.push(
        //       heading(options.headingLevel, this.getText('label.implementationOf')),
        //     );
        //   }
        //   md.push(this.partials.typeAndParent(model.implementationOf));
        // }

        // if (model.inheritedFrom) {
        //   if (options.headingLevel !== -1) {
        //     md.push(
        //       heading(options.headingLevel, this.getText('label.inheritedFrom')),
        //     );
        //   }
        //   md.push(this.partials.typeAndParent(model.inheritedFrom));
        // }

        // if (model.overwrites) {
        //   const overridesLabel = this.getText('label.overrides');
        //   if (options.headingLevel !== -1) {
        //     md.push(heading(options.headingLevel, overridesLabel));
        //   }
        //   md.push(this.partials.typeAndParent(model.overwrites));
        // }

        // return md.join('\n\n');
      },

      signatureReturns: (model, options) => {
        const md = [];
        const typeDeclaration = model.type?.declaration;
        // md.push(heading(options.headingLevel, i18n.theme_returns()));
        if (typeDeclaration?.signatures) {
          md.push(backTicks('Function'));
        } else {
          md.push(this.helpers.getReturnType(model.type));
        }
        if (model.comment?.blockTags.length) {
          const tags = model.comment.blockTags
            .filter((tag) => tag.tag === '@returns')
            .map((tag) => this.helpers.getCommentParts(tag.content));
          md.push(tags.join('\n\n'));
        }
        if (typeDeclaration?.signatures) {
          typeDeclaration.signatures.forEach((signature) => {
            md.push(
              this.partials.signature(signature, {
                headingLevel: options.headingLevel + 1,
                nested: true,
              })
            );
          });
        }
        if (typeDeclaration?.children) {
          md.push(
            this.partials.typeDeclaration(typeDeclaration, {
              headingLevel: options.headingLevel,
            })
          );
        }
        if (md.length === 1) return ''; // @custom
        return md.join('\n\n');
      },

      /**
       * Renders a top-level member that contains group and child members such as Classes, Interfaces and Enums.
       */
      memberWithGroups: (model, options) => {
        const md = [];

        if (
          ![ReflectionKind.Module, ReflectionKind.Namespace].includes(
            model.kind
          ) &&
          model.sources &&
          !this.options.getValue('disableSources')
        ) {
          md.push(this.partials.sources(model));
        }

        if (model.comment) {
          md.push(
            this.partials.comment(model.comment, {
              headingLevel: options.headingLevel,
            })
          );
        }

        if (model.typeHierarchy?.next) {
          md.push(
            this.partials.hierarchy(model.typeHierarchy, {
              headingLevel: options.headingLevel,
            })
          );
        }

        // @custom
        // if (model.typeParameters?.length) {
        //   md.push(
        //     heading(
        //       options.headingLevel,
        //       this.internationalization.kindPluralString(
        //         ReflectionKind.TypeParameter,
        //       ),
        //     ),
        //   );
        //   if (this.helpers.useTableFormat('parameters')) {
        //     md.push(this.partials.typeParametersTable(model.typeParameters));
        //   } else {
        //     md.push(this.partials.typeParametersList(model.typeParameters));
        //   }
        // }

        // @custom
        // if (model.implementedTypes?.length) {
        //   md.push(heading(options.headingLevel, i18n.theme_implements()));
        //   md.push(
        //     unorderedList(
        //       model.implementedTypes.map((implementedType) =>
        //         this.partials.someType(implementedType),
        //       ),
        //     ),
        //   );
        // }

        if (model.kind === ReflectionKind.Class && model.categories?.length) {
          model.groups
            ?.filter((group) => group.title === i18n.kind_plural_constructor())
            .forEach((group) => {
              // md.push(
              //   heading(
              //     options.headingLevel,
              //     i18n.kind_plural_constructor(),
              //   ),
              // );
              group.children.forEach((child) => {
                md.push(
                  this.partials.constructor(child, {
                    headingLevel: options.headingLevel, // @custom +1 ,
                  })
                );
              });
            });
        }

        if ('signatures' in model && model.signatures?.length) {
          model.signatures.forEach((signature) => {
            md.push(
              this.partials.signature(signature, {
                headingLevel: options.headingLevel,
              })
            );
          });
        }

        if (model.indexSignatures?.length) {
          md.push(heading(options.headingLevel, i18n.theme_indexable()));
          model.indexSignatures.forEach((indexSignature) => {
            md.push(this.partials.indexSignature(indexSignature));
          });
        }

        md.push(
          this.partials.body(model, { headingLevel: options.headingLevel })
        );

        return md.join('\n\n');
      },

      members: (model, options) => {
        const md = [];
        // const displayHr = (reflection) => {
        //   if (this.options.getValue('outputFileStrategy') === 'modules') {
        //     return this.helpers.isGroupKind(reflection);
        //   }
        //   return true;
        // };
        const items = model?.filter((item) => !item.hasOwnDocument);
        items?.forEach((item, index) => {
          md.push(
            this.partials.member(item, { headingLevel: options.headingLevel })
          );
          // if (index < items.length - 1 && displayHr(item)) {
          //   md.push(horizontalRule());
          // }
        });
        return md.join('\n\n');
      },

      member: (model, options) => {
        const md = [];

        if (this.options.getValue('useHTMLAnchors') && model.anchor) {
          const id = fullAnchor(model);
          md.push(`<a id="${id}" name="${id}"></a>`);
        }

        let hasCard = false;

        if (!model.hasOwnDocument) {
          hasCard = ![
            ReflectionKind.Project,
            ReflectionKind.Class,
            ReflectionKind.Interface,
            ReflectionKind.Enum,
            //  ReflectionKind.TypeAlias,  @custom
          ].includes(model.kind);

          // If the parent is a type literal, we don't get a card @custom
          if (model.parent?.kind === ReflectionKind.TypeLiteral)
            hasCard = false;

          let memberName = this.partials.memberTitle(model);

          if (model.kind === ReflectionKind.Constructor) {
            memberName = `new ${model.parent.name}()`;
          } else if (model.parent?.kind === ReflectionKind.TypeLiteral) {
            memberName = `${model.parent.parent.name}.${memberName}`;
          } else {
            if (
              model.parent &&
              [
                ReflectionKind.Class,
                ReflectionKind.Interface,
                ReflectionKind.Enum,
                ReflectionKind.TypeAlias,
              ].includes(model.parent.kind)
            )
              memberName = `${model.parent.name}.${memberName}`;
          }
          if (hasCard) {
            console.log('hasCard ' + model.name + ' ' + model.kind);
            md.push(`<MemberCard>`);
          }

          md.push(heading(options.headingLevel, memberName));
        }

        const getMember = (reflection) => {
          if (
            [
              ReflectionKind.Project,
              ReflectionKind.Module,
              ReflectionKind.Class,
              ReflectionKind.Interface,
              ReflectionKind.Enum,
            ].includes(reflection.kind) ||
            (model.kind === ReflectionKind.TypeAlias && model.groups)
          ) {
            return this.partials.memberWithGroups(reflection, {
              headingLevel: options.headingLevel + 1,
            });
          }

          if (reflection.kind === ReflectionKind.Constructor)
            return this.partials.constructor(reflection, {
              headingLevel: options.headingLevel,
            });

          if (reflection.kind === ReflectionKind.Accessor)
            return this.partials.accessor(reflection, {
              headingLevel: options.headingLevel + 1,
            });

          if (reflection.signatures) {
            return reflection.signatures
              ?.map((signature) => {
                const signatureMd = [];
                const multipleSignatures =
                  reflection.signatures && reflection.signatures?.length > 1;

                if (multipleSignatures) {
                  signatureMd.push(
                    heading(
                      options.headingLevel + 1,
                      `${escapeChars(signature.name)}(${signature.parameters
                        ?.map((param) => param.name)
                        .join(', ')})`
                    )
                  );
                }
                signatureMd.push(
                  this.partials.signature(signature, {
                    headingLevel: multipleSignatures
                      ? options.headingLevel + 2
                      : options.headingLevel + 1,
                    nested: options.nested,
                  })
                );
                return signatureMd.join('\n\n');
              })
              .join('\n\n');
          }

          if (reflection instanceof ReferenceReflection)
            return this.partials.referenceMember(reflection);

          return this.partials.declaration(reflection, {
            headingLevel: options.headingLevel + 1,
            nested: options.nested,
          });
        };

        const memberMarkdown = getMember(model);

        if (memberMarkdown) md.push(memberMarkdown);

        if (hasCard) md.push('</MemberCard>');

        return md.join('\n\n');
      },

      accessor: (model, options) => {
        const md = [];
        const showSources = model?.parent?.kind !== ReflectionKind.TypeLiteral;
        let signature = '';
        if (model.getSignature) {
          // @custom
          // md.push(
          //   heading(
          //     options.headingLevel,
          //     this.internationalization.proxy.kind_get_signature(),
          //   ),
          // );
          signature = this.partials.signatureTitle(model.getSignature, {
            accessor: 'get',
          });

          if (showSources && !this.options.getValue('disableSources')) {
            if (model.getSignature?.sources) {
              md.push(this.partials.sources(model.getSignature));
            }
          }
          // if (model.getSignature?.type) {
          //   md.push(
          //     this.partials.signatureReturns(model.getSignature, {
          //       headingLevel: options.headingLevel + 1,
          //     }),
          //   );
          // }
        }
        if (model.setSignature) {
          // md.push(
          //   heading(
          //     options.headingLevel,
          //     this.internationalization.proxy.kind_set_signature()
          //   )
          // ); @custom
          const setSignature = this.partials.signatureTitle(
            model.setSignature,
            {
              accessor: 'set',
            }
          );

          if (signature) {
            // Merge the signature and setSignature code blocks
            signature =
              signature.split('\n').slice(0, -1).join('\n') +
              `\n${setSignature.split('\n').slice(1).join('\n')}`;
            md.push(signature);
          } else md.push(setSignature);

          if (showSources && !this.options.getValue('disableSources')) {
            if (model.setSignature?.sources) {
              md.push(this.partials.sources(model.setSignature));
            }
          }
          // @custom: we group the get/set signature together nstead
          // if (model.setSignature?.parameters?.length) {
          //   // @custom
          //   // md.push(
          //   //     heading(
          //   //       options.headingLevel + 1,
          //   //       this.internationalization.kindPluralString(
          //   //         ReflectionKind.Parameter,
          //   //       ),
          //   //     ),
          //   // );
          //   if (this.helpers.useTableFormat('parameters')) {
          //     md.push(
          //       this.partials.parametersTable(model.setSignature.parameters),
          //     );
          //   } else {
          //     md.push(
          //       this.partials.parametersList(model.setSignature.parameters, {
          //         headingLevel: options.headingLevel + 1,
          //       }),
          //     );
          //   }
          // }
          // @custom
          // if (model.setSignature?.type) {
          //   md.push(
          //     this.partials.signatureReturns(model.setSignature, {
          //       headingLevel: options.headingLevel + 1,
          //     }),
          //   );
          // }
        }

        if (showSources && !this.options.getValue('disableSources')) {
          if (!model.getSignature && !model.setSignature) {
            md.push(this.partials.sources(model));
          }
        }

        if (model.comment) {
          md.push(
            this.partials.comment(model.comment, {
              headingLevel: options.headingLevel,
            })
          );
        }
        if (model.getSignature?.comment) {
          md.push(
            this.partials.comment(model.getSignature.comment, {
              headingLevel: options.headingLevel + 1,
            })
          );
        }
        if (model.setSignature?.comment) {
          md.push(
            this.partials.comment(model.setSignature.comment, {
              headingLevel: options.headingLevel + 1,
            })
          );
        }

        md.push(
          this.partials.inheritance(model, {
            headingLevel: options.headingLevel,
          })
        );
        return md.join('\n\n');
      },

      // Outputs `(arg1, arg2, argOther): void`
      signatureParameters: (model, options) => {
        const format = this.options.getValue('useCodeBlocks');
        const firstOptionalParamIndex = model.findIndex(
          (parameter) => parameter.flags.isOptional
        );
        return (
          '(' +
          model
            .map((param, i) => {
              const paramsmd = [];
              if (param.flags.isRest) {
                paramsmd.push('...');
              }
              const paramType = this.partials.someType(param.type);
              const showParamType =
                this.options.getValue('expandParameters') ||
                (options?.showParamType ?? false);
              const paramItem = [
                `${backTicks(param.name)}${
                  param.flags.isOptional ||
                  (firstOptionalParamIndex !== -1 &&
                    i > firstOptionalParamIndex)
                    ? '?'
                    : ''
                }`,
              ];
              if (showParamType) {
                paramItem.push(paramType);
              }
              paramsmd.push(
                `${format && model.length > 3 ? `\n   ` : ''}${paramItem.join(': ')}`
              );
              return paramsmd.join('');
            })
            .join(`, `) +
          ')'
        );
      },

      // In a function signature, the codeblock representing the signature,
      // e.g.
      // ```ts
      // function subPublicFunctionsig(
      //    arg1,
      //    arg2?, ...
      //    argOther?): void
      // ```

      signatureTitle: (model, options) => {
        const md = [];

        const useCodeBlocks = this.options.getValue('useCodeBlocks');
        const keyword = this.helpers.getKeyword(model.parent.kind);

        if (
          useCodeBlocks &&
          this.helpers.isGroupKind(model.parent) &&
          keyword
        ) {
          md.push(keyword + ' ');
        }

        if (options?.accessor) {
          md.push(options?.accessor + ' ');
        }

        if (model.parent) {
          const flagsString = this.helpers.getReflectionFlags(
            model.parent?.flags
          );
          if (flagsString.length) {
            md.push(this.helpers.getReflectionFlags(model.parent.flags) + ' ');
          }
        }

        if (!['__call', '__type'].includes(model.name)) {
          const name = [];
          if (model.kind === ReflectionKind.ConstructorSignature) {
            name.push('new');
          }
          name.push(escapeChars(model.name));
          md.push(name.join(' '));
        }

        if (model.typeParameters) {
          md.push(
            `${this.helpers.getAngleBracket('<')}${model.typeParameters
              .map((typeParameter) => backTicks(typeParameter.name))
              .join(', ')}${this.helpers.getAngleBracket('>')}`
          );
        }

        md.push(
          this.partials.signatureParameters(model.parameters || [], {
            showParamType: options?.accessor ?? false,
          })
        );

        if (model.type) {
          md.push(`: ${this.partials.someType(model.type)}`);
        }

        const result = md.join('');
        return useCodeBlocks ? codeBlock(result) : `> ${result}`;
      },

      signature: (model, options) => {
        const md = []; // ['*** signature'];
        if (!options.nested) {
          md.push(
            this.partials.signatureTitle(model, {
              accessor: options.accessor,
            })
          );
        }
        if (
          !options.nested &&
          model.sources &&
          !this.options.getValue('disableSources')
        ) {
          md.push(this.partials.sources(model));
        }
        let modelComments = options.multipleSignatures
          ? model.comment
          : model.comment || model.parent?.comment;
        if (
          modelComments &&
          model.parent?.comment?.summary &&
          !options.multipleSignatures
        ) {
          modelComments = Object.assign(modelComments, {
            summary: model.parent.comment.summary,
          });
        }
        if (modelComments && model.parent?.comment?.blockTags) {
          modelComments.blockTags = [
            ...(model.parent?.comment?.blockTags || []),
            ...(model.comment?.blockTags || []),
          ];
        }
        if (modelComments) {
          md.push(
            this.partials.comment(modelComments, {
              headingLevel: options.headingLevel,
              showTags: false,
              showSummary: true,
            })
          );
        }
        if (!options.multipleSignatures && model.parent?.documents) {
          md.push(
            this.partials.documents(model?.parent, {
              headingLevel: options.headingLevel,
            })
          );
        }
        if (
          model.typeParameters?.length &&
          model.kind !== ReflectionKind.ConstructorSignature
        ) {
          // md.push(
          //   heading(
          //     options.headingLevel,
          //     this.internationalization.kindPluralString(
          //       ReflectionKind.TypeParameter
          //     )
          //   )
          // ); @custom
          if (this.helpers.useTableFormat('parameters')) {
            md.push(this.partials.typeParametersTable(model.typeParameters));
          } else {
            md.push(this.partials.typeParametersList(model.typeParameters));
          }
        }
        if (model.parameters?.length) {
          // md.push(
          //   heading(
          //     options.headingLevel,
          //     this.internationalization.kindPluralString(
          //       ReflectionKind.Parameter
          //     )
          //   )
          // ); @custom
          if (this.helpers.useTableFormat('parameters')) {
            md.push(this.partials.parametersTable(model.parameters));
          } else {
            md.push(
              this.partials.parametersList(model.parameters, {
                headingLevel: options.headingLevel,
              })
            );
          }
        }
        // if (model.type) {
        //   md.push(
        //     this.partials.signatureReturns(model, {
        //       headingLevel: options.headingLevel,
        //     }),
        //   );
        // } @custom
        if (modelComments) {
          md.push(
            this.partials.comment(modelComments, {
              headingLevel: options.headingLevel,
              showTags: true,
              showSummary: false,
            })
          );
        }
        // md.push(
        //   this.partials.inheritance(model, {
        //     headingLevel: options.headingLevel,
        //   }),
        // ); @custom
        return md.join('\n\n');
      },

      /* Declaration of a type as in:
       * ```ts
       * type MyType = {
       *  prop1: string;
       *  prop2: number;
       * }
       * ```
       */
      typeDeclarationContainer: (model, typeDeclaration, opts) => {
        const md = []; // ['***typeDeclarationContainer'];

        if (typeDeclaration?.indexSignatures?.length) {
          md.push(heading(opts.headingLevel, i18n.kind_index_signature()));
          typeDeclaration?.indexSignatures?.forEach((indexSignature) => {
            md.push(this.partials.indexSignature(indexSignature));
          });
        }

        if (typeDeclaration?.signatures?.length) {
          typeDeclaration.signatures.forEach((signature) => {
            md.push(
              this.partials.signature(signature, {
                headingLevel: opts.headingLevel,
                nested: true,
              })
            );
          });
        }

        if (typeDeclaration?.children?.length) {
          const useHeading =
            model.kind !== ReflectionKind.Property ||
            this.helpers.useTableFormat('properties');
          if (!opts.nested && typeDeclaration?.children?.length) {
            if (typeDeclaration.categories) {
              typeDeclaration.categories.forEach((category) => {
                md.push(heading(opts.headingLevel, category.title));
                md.push(
                  this.partials.typeDeclaration(category, {
                    headingLevel: useHeading
                      ? opts.headingLevel + 1
                      : opts.headingLevel,
                  })
                );
              });
            } else {
              md.push(
                this.partials.typeDeclaration(typeDeclaration, {
                  headingLevel: useHeading
                    ? opts.headingLevel
                    : opts.headingLevel - 1,
                })
              );
            }
          }
        }
        return md.join('\n\n');
      },

      typeParametersList: (model) => {
        const rows = [];
        model?.forEach((typeParameter) => {
          const row = [];

          const nameCol = [typeParameter.name];

          if (typeParameter.type) {
            nameCol.push(
              `${'extends'} ${this.partials.someType(typeParameter.type)}`
            );
          }

          if (typeParameter.default) {
            nameCol.push(
              `= ${this.partials.someType(typeParameter.default, { forceCollapse: true })}`
            );
          }

          row.push('• ' + nameCol.join(' '));

          if (typeParameter.comment) {
            row.push(this.partials.comment(typeParameter.comment));
          }

          rows.push(row.join('\n\n'));
        });

        return rows.join('\n\n');
      },

      typeDeclarationList: (model, options) => {
        const md = []; //  ['***typedeclarationlist'];

        const useCodeBlocks = this.options.getValue('useCodeBlocks');
        const isCompact =
          this.options.getValue('typeDeclarationVisibility') === 'compact'; // or 'verbose';

        const declarations = isCompact
          ? model
          : this.helpers.getFlattenedDeclarations(model);

        declarations?.forEach((declaration) => {
          // @custom
          if (
            declaration &&
            !declaration.hasComment?.() &&
            !this.helpers.hasUsefulTypeDetails(declaration)
          )
            return;
          if (isCompact && declaration.type instanceof ReflectionType) {
            md.push(
              heading(
                options.headingLevel + 1,
                this.partials.memberTitle(declaration)
              )
            );
            const result = this.partials.reflectionType(declaration.type, {
              forceCollapse: isCompact,
            });
            md.push(useCodeBlocks ? codeBlock(result) : `> ${result}`);
            if (declaration.comment) {
              md.push(
                this.partials.comment(declaration.comment, {
                  headingLevel: options.headingLevel,
                })
              );
            }
          } else {
            md.push(
              this.partials.memberContainer(declaration, {
                headingLevel: declaration.name.includes('.')
                  ? options.headingLevel + 1 // +2 @custom
                  : options.headingLevel, // + 1, @custom
                nested: true,
              })
            );
          }
        });

        return md.join('\n\n');
      },

      // The type declaration itself, as in:
      // ```ts
      // type MyType = {
      //  prop1: string;
      //  prop2: number;
      // }
      // ```
      // This will output the `{...}` part
      // declaration -> declarationTitle -> someType -> reflectionType -> declarationType
      declarationType: (model, options) => {
        const shouldFormat = this.options.getValue('useCodeBlocks');

        if (model.indexSignatures || model.children) {
          const indexSignatureMd = [];

          if (model.indexSignatures?.length) {
            model.indexSignatures.forEach((indexSignature) => {
              const key = indexSignature.parameters
                ? indexSignature.parameters.map(
                    (param) => `\`[${param.name}: ${param.type}]\``
                  )
                : '';
              const obj = this.partials.someType(indexSignature.type);
              indexSignatureMd.push(`${key}: ${obj}; `);
            });
          }

          const children = model.children;

          const types =
            children &&
            children.map((obj) => {
              const name = [];

              if (obj.getSignature || Boolean(obj.setSignature)) {
                if (obj.getSignature) {
                  name.push('get');
                }
                if (obj.setSignature) {
                  name.push('set');
                }
              }

              name.push(backTicks(obj.name));

              const theType = this.helpers.getDeclarationType(obj);

              const typeString = this.partials.someType(theType, options);

              if (shouldFormat) {
                return `  ${name.join(' ')}: ${indentBlock(typeString)};\n`;
              }
              return `${name.join(' ')}: ${indentBlock(typeString)};`;
            });

          if (indexSignatureMd) {
            indexSignatureMd.forEach((indexSignature) => {
              types?.unshift(indexSignature);
            });
          }
          return types
            ? `\\{${shouldFormat ? `\n${types.join('')}` : ` ${types.join(' ')}`} \\}`
            : '\\{\\}';
        }
        return '\\{\\}';
      },
    };
  }
}

function escapeChars(str) {
  return str
    .replace(/>/g, '\\>')
    .replace(/</g, '\\<')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\*/g, '\\*');
}

function unEscapeChars(str) {
  return str
    .replace(
      /(`[^`]*?)\\*([^`]*?`)/g,
      (match, p1, p2) => `${p1}${p2.replace(/\*/g, '\\*')}`
    )
    .replace(/\\\\/g, '\\')
    .replace(/(?<!\\)\*/g, '')
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\_/g, '_')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/``.*?``|(?<!\\)`/g, (match) =>
      match.startsWith('``') ? match : ''
    )
    .replace(/`` /g, '')
    .replace(/ ``/g, '')
    .replace(/\\`/g, '`')
    .replace(/\\\*/g, '*')
    .replace(/\\\|/g, '|')
    .replace(/\\\]/g, ']')
    .replace(/\\\[/g, '[')
    .replace(/\[([^[\]]*)\]\((.*?)\)/gm, '$1');
}

function codeBlock(content) {
  const trimLastLine = (content) => {
    const lines = content.split('\n');
    return lines
      .map((line, index) => (index === lines.length - 1 ? line.trim() : line))
      .join('\n');
  };
  const trimmedContent =
    content.endsWith('}') ||
    content.endsWith('};') ||
    content.endsWith('>') ||
    content.endsWith('>;')
      ? trimLastLine(content)
      : content;
  return '```ts\n' + unEscapeChars(trimmedContent) + '\n```';
}

/**
 * Returns a heading in markdown format
 * @param level The level of the heading
 * @param text The text of the heading
 */
function heading(level, text) {
  level = level > 6 ? 6 : level;
  return `${[...Array(level)].map(() => '#').join('')} ${text}`;
}

function indentBlock(content) {
  const lines = content.split(`${'\n'}`);
  return lines
    .filter((line) => Boolean(line.length))
    .map((line, i) => {
      if (i === 0) {
        return line;
      }
      if (i === lines.length - 1) {
        return line.trim().startsWith('}') ? line : `   ${line}`;
      }
      return `   ${line}`;
    })
    .join(`${`\n`}`);
}

function getReturnType(context, typeDeclaration, type) {
  if (typeDeclaration?.signatures) return context.partials.someType(type);

  if (type) {
    const returnType = context.partials.someType(type);
    if (context.options.getValue('useCodeBlocks')) {
      if (
        type instanceof ReflectionType &&
        context.options.getValue('expandObjects')
      )
        return codeBlock(returnType);
    }
    return returnType;
  }
  return '';
}

function printStackTrace(s) {
  var err = new Error();
  console.log(s + '\n' + err.stack.split('\n').slice(2).join('\n'));
}

function fullAnchor(model) {
  const parent = model.parent?.anchor;
  if (!parent) return model.anchor;

  if (['__call', '__type'].includes(model.parent.name)) {
    return `${fullAnchor(model.parent.parent)}_${model.anchor}`;
  }
  return `${model.parent.anchor}_${model.anchor}`;
}

function horizontalRule() {
  return '\n\n***\n\n';
}

function isNoneSection(section) {
  return section.title.toLocaleLowerCase() === 'none';
}

function sortNoneSectionFirst(a, b) {
  if (isNoneSection(a)) {
    return -1;
  }
  if (isNoneSection(b)) {
    return 1;
  }
  return 0;
}
