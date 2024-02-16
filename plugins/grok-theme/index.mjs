/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
import {
  DeclarationReflection,
  ReferenceReflection,
  ReferenceType,
  ReflectionKind,
  ReflectionType,
} from 'typedoc';
import {
  MarkdownHooks,
  MarkdownPageEvent,
  MarkdownTheme,
  MarkdownThemeRenderContext,
} from 'typedoc-plugin-markdown';

import {
  backTicks,
  blockQuoteBlock,
  codeBlock,
  heading,
  horizontalRule,
} from 'typedoc-plugin-markdown/dist/theme/resources/markdown/index.js';

import { escapeChars } from 'typedoc-plugin-markdown/dist/theme/resources/utils/index.js';

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

class GrokThemeRenderContext extends MarkdownThemeRenderContext {
  superPartials = this.partials;
  partials = {
    ...this.partials,

    inheritance: (context, reflection, headingLevel) => {
      return '';
    },

    signatureMemberReturns: (signature, headingLevel) => {
      const context = this;
      const md = [];

      const typeDeclaration = signature.type?.declaration;

      // md.push(heading(headingLevel, context.text.getText('label.returns')));

      md.push(getReturnType(context, typeDeclaration, signature.type));

      if (signature.comment?.blockTags.length) {
        const tags = signature.comment.blockTags
          .filter((tag) => tag.tag === '@returns')
          .map((tag) => context.partials.commentParts(tag.content));
        md.push(tags.join('\n\n'));
      }

      if (
        signature.type instanceof ReferenceType &&
        signature.type.typeArguments?.length
      ) {
        if (signature.type.typeArguments[0] instanceof ReflectionType) {
          md.push(
            blockQuoteBlock(
              context.partials.typeDeclarationMember(
                signature.type.typeArguments[0].declaration,
                headingLevel
              )
            )
          );
        }
      }

      if (typeDeclaration?.signatures) {
        typeDeclaration.signatures.forEach((signature) => {
          md.push(
            blockQuoteBlock(
              context.partials.signatureMember(
                signature,
                headingLevel + 1,
                true
              )
            )
          );
        });
      }

      if (typeDeclaration?.children) {
        md.push(
          context.partials.typeDeclarationMember(typeDeclaration, headingLevel)
        );
      }

      return md.join('\n\n');
    },

    constructorMember: (reflection, headingLevel) => {
      const context = this;
      const md = [];

      reflection.signatures?.forEach((signature) => {
        // const params = signature.parameters
        //   ?.map((param) => param.name)
        //   .join(', ');
        // md.push(
        //   heading(headingLevel, `${escapeChars(signature.name)}(${params})`)
        // );
        md.push(context.partials.signatureMember(signature, headingLevel + 1));
      });

      return md.join('\n\n');
    },

    members: (container, headingLevel) => {
      const context = this;
      const md = [];

      const displayHr = (reflection) => {
        if (context.options.getValue('outputFileStrategy') === 'modules')
          return context.helpers.isGroupKind(reflection);

        return true;
      };

      const pushCategories = (categories, headingLevel) => {
        categories
          ?.filter((category) => !category.allChildrenHaveOwnDocument())
          .forEach((item) => {
            md.push(heading(headingLevel, item.title));
            pushChildren(item.children, headingLevel + 1);
          });
      };

      const pushChildren = (children, memberHeadingLevel) => {
        const items = children?.filter((item) => !item.hasOwnDocument);
        items?.forEach((item, index) => {
          md.push(
            context.partials.member(item, memberHeadingLevel || headingLevel)
          );
          // if (index < items.length - 1 && displayHr(item)) {
          //   md.push(horizontalRule());
          // }
        });
      };

      if (container.categories?.length)
        pushCategories(container.categories, headingLevel);
      else {
        const containerKinds = [
          ReflectionKind.Project,
          ReflectionKind.Module,
          ReflectionKind.Namespace,
        ];
        if (
          context.options.getValue('excludeGroups') &&
          containerKinds.includes(container.kind)
        ) {
          if (container.categories?.length)
            pushCategories(container.categories, headingLevel);
          else pushChildren(container.children, headingLevel);
        } else {
          const groupsWithChildren = container.groups?.filter(
            (group) => !group.allChildrenHaveOwnDocument()
          );
          groupsWithChildren?.forEach((group, index) => {
            if (group.categories) {
              md.push(
                heading(
                  headingLevel,
                  context.text.getTextFromKindString(group.title, true)
                )
              );
              pushCategories(group.categories, headingLevel + 1);
            } else {
              const isPropertiesGroup = group.children.every(
                (child) => child.kind === ReflectionKind.Property
              );

              const isEnumGroup = group.children.every(
                (child) => child.kind === ReflectionKind.EnumMember
              );

              // md.push(
              //   heading(
              //     headingLevel,
              //     context.text.getTextFromKindString(group.title, true)
              //   )
              // );

              if (
                isPropertiesGroup &&
                context.options.getValue('propertiesFormat') === 'table'
              ) {
                md.push(
                  context.partials.propertiesTable(
                    group.children,
                    context.text.getTextFromKindString(group.title, true) ===
                      context.text.getText('kind.event.plural')
                  )
                );
              } else if (
                isEnumGroup &&
                context.options.getValue('enumMembersFormat') === 'table'
              )
                md.push(context.partials.enumMembersTable(group.children));
              else pushChildren(group.children, headingLevel + 1);
            }
          });
        }
      }

      return md.join('\n\n');
    },

    reflectionMember: (reflection, headingLevel) => {
      const context = this;
      const md = [];

      if (reflection.comment)
        md.push(context.partials.comment(reflection.comment, headingLevel));

      if (reflection.typeHierarchy?.next) {
        md.push(
          context.partials.memberHierarchy(
            reflection.typeHierarchy,
            headingLevel
          )
        );
      }

      if (reflection.typeParameters) {
        // md.push(
        //   heading(
        //     headingLevel,
        //     context.text.getText('kind.typeParameter.plural')
        //   )
        // );
        if (context.options.getValue('parametersFormat') === 'table') {
          md.push(
            context.partials.typeParametersTable(reflection.typeParameters)
          );
        } else {
          md.push(
            context.partials.typeParametersList(reflection.typeParameters)
          );
        }
      }

      // if (reflection.implementedTypes) {
      //   md.push(
      //     heading(headingLevel, context.text.getText('label.implements'))
      //   );
      //   md.push(
      //     unorderedList(
      //       reflection.implementedTypes.map((implementedType) =>
      //         context.partials.someType(implementedType)
      //       )
      //     )
      //   );
      // }

      if ('signatures' in reflection && reflection.signatures) {
        reflection.signatures.forEach((signature) => {
          md.push(context.partials.signatureMember(signature, headingLevel));
        });
      }

      if ('indexSignature' in reflection && reflection.indexSignature) {
        // md.push(heading(headingLevel, context.text.getText('label.indexable')));
        md.push(
          context.partials.indexSignatureTitle(reflection.indexSignature)
        );
      }

      if (
        reflection?.groups?.some((group) => group.allChildrenHaveOwnDocument())
      ) {
        const isAbsolute = reflection.groups?.every((group) =>
          group.allChildrenHaveOwnDocument()
        );
        // if (isAbsolute) {
        //   md.push(heading(headingLevel, context.text.getText('label.index')));
        // }
        md.push(
          context.partials.reflectionIndex(
            reflection,
            isAbsolute ? headingLevel + 1 : headingLevel
          )
        );
      }

      md.push(context.partials.members(reflection, headingLevel));

      return md.join('\n\n');
    },

    signatureMember: (signature, headingLevel, nested = false, accessor) => {
      const context = this;
      const md = [];

      md.push(context.partials.reflectionFlags(signature));

      if (!nested) {
        md.push(
          context.partials.signatureMemberIdentifier(signature, {
            accessor,
          })
        );
      }

      if (signature.comment) {
        md.push(
          context.partials.comment(signature.comment, headingLevel, true, false)
        );
      }

      if (
        signature.typeParameters?.length &&
        signature.kind !== ReflectionKind.ConstructorSignature
      ) {
        // md.push(
        //   heading(
        //     headingLevel,
        //     context.text.getText('kind.typeParameter.plural')
        //   )
        // );
        if (context.options.getValue('parametersFormat') === 'table') {
          md.push(
            context.partials.typeParametersTable(signature.typeParameters)
          );
        } else {
          md.push(
            context.partials.typeParametersList(signature.typeParameters)
          );
        }
      }

      if (signature.parameters?.length) {
        // md.push(
        //   heading(headingLevel, context.text.getText('kind.parameter.plural'))
        // );
        if (context.options.getValue('parametersFormat') === 'table')
          md.push(context.partials.parametersTable(signature.parameters));
        else md.push(context.partials.parametersList(signature.parameters));
      }

      // if (signature.type) {
      //   md.push(
      //     context.partials.signatureMemberReturns(signature, headingLevel)
      //   );
      // }

      md.push(context.partials.inheritance(signature, headingLevel));

      if (signature.comment) {
        md.push(
          context.partials.comment(signature.comment, headingLevel, false, true)
        );
      }

      if (
        !nested &&
        signature.sources &&
        !context.options.getValue('disableSources')
      )
        md.push(context.partials.sources(signature, headingLevel));

      return md.join('\n\n');
    },

    accessorMember: (declaration, headingLevel) => {
      const context = this;
      const md = [];

      if (declaration.getSignature) {
        md.push(
          context.partials.signatureMemberIdentifier(declaration.getSignature, {
            accessor: 'get',
          })
        );
      }
      if (declaration.setSignature) {
        md.push(
          context.partials.signatureMemberIdentifier(declaration.setSignature, {
            accessor: 'set',
          })
        );
      }

      if (declaration.getSignature?.comment) {
        md.push(
          context.partials.comment(
            declaration.getSignature.comment,
            headingLevel
          )
        );
      }
      if (declaration.setSignature?.comment) {
        md.push(
          context.partials.comment(
            declaration.setSignature.comment,
            headingLevel
          )
        );
      }

      if (declaration.getSignature?.type) {
        md.push(
          context.partials.signatureMemberReturns(
            declaration.getSignature,
            headingLevel
          )
        );
      }

      if (declaration.setSignature?.parameters?.length) {
        // md.push(
        //   heading(headingLevel, context.text.getText('kind.parameter.plural'))
        // );
        if (context.options.getValue('parametersFormat') === 'table') {
          md.push(
            context.partials.parametersTable(
              declaration.setSignature.parameters
            )
          );
        } else {
          md.push(
            context.partials.parametersList(declaration.setSignature.parameters)
          );
        }
      }

      const showSources =
        declaration?.parent?.kind !== ReflectionKind.TypeLiteral;

      if (showSources && !context.options.getValue('disableSources')) {
        if (declaration.getSignature?.sources) {
          md.push(
            context.partials.sources(declaration.getSignature, headingLevel)
          );
        } else if (declaration.setSignature?.sources) {
          md.push(
            context.partials.sources(declaration.setSignature, headingLevel)
          );
        }
      }

      return md.join('\n\n');
    },

    member: (reflection, headingLevel, nested, parentDeclaration) => {
      const context = this;
      const md = [];

      if (context.options.getValue('namedAnchors') && reflection.anchor) {
        const id = reflection.anchor;
        md.push(`<a id="${id}" name="${id}"></a>`);
      }

      let hasCard = false;
      if (!reflection.hasOwnDocument) {
        hasCard = ![
          ReflectionKind.Class,
          ReflectionKind.Interface,
          ReflectionKind.Enum,
          ReflectionKind.TypeAlias,
        ].includes(reflection.kind);

        let memberName = context.partials.memberTitle(reflection);

        // if (memberName.startsWith('parseArgumentsOfUnknownLatexCommands')) {
        //   console.log('reflection', reflection.parent);
        // }

        if (reflection.kind === ReflectionKind.Constructor) {
          memberName = `new ${reflection.parent.name}()`;
        } else if (reflection.parent?.kind === ReflectionKind.TypeLiteral) {
          memberName = `${reflection.parent.parent.name}.${memberName}`;
        } else {
          if (
            reflection.parent &&
            [
              ReflectionKind.Class,
              ReflectionKind.Interface,
              ReflectionKind.Enum,

              ReflectionKind.TypeAlias,
            ].includes(reflection.parent.kind)
          )
            memberName = `${reflection.parent.name}.${memberName}`;
        }
        if (hasCard) md.push(`<MemberCard>`);
        md.push(heading(headingLevel, memberName));
      }

      const getMember = (reflection) => {
        if (
          [
            ReflectionKind.Class,
            ReflectionKind.Interface,
            ReflectionKind.Enum,
          ].includes(reflection.kind)
        ) {
          return context.partials.reflectionMember(
            reflection,
            headingLevel + 1
          );
        }

        if (reflection.kind === ReflectionKind.Constructor)
          return context.partials.constructorMember(reflection, headingLevel);

        if (reflection.kind === ReflectionKind.Accessor)
          return context.partials.accessorMember(reflection, headingLevel + 1);

        if (reflection.signatures) {
          return reflection.signatures
            ?.map((signature) => {
              const signatureMd = [];
              const multipleSignatures =
                reflection.signatures && reflection.signatures?.length > 1;

              if (multipleSignatures) {
                signatureMd.push(
                  heading(
                    headingLevel + 1,
                    `${escapeChars(signature.name)}(${signature.parameters
                      ?.map((param) => param.name)
                      .join(', ')})`
                  )
                );
              }
              signatureMd.push(
                context.partials.signatureMember(
                  signature,
                  multipleSignatures ? headingLevel + 2 : headingLevel + 1,
                  nested
                )
              );
              return signatureMd.join('\n\n');
            })
            .join('\n\n');
        }

        if (reflection instanceof ReferenceReflection)
          return context.partials.referenceMember(reflection);

        return context.partials.declarationMember(
          reflection,
          headingLevel + 1,
          nested
        );
      };

      const memberMarkdown = getMember(reflection);

      if (memberMarkdown) md.push(memberMarkdown);

      if (hasCard) md.push('</MemberCard>');

      return md.join('\n\n');
    },
  };
}
