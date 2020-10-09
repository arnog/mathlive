## Adding a submodule

```bash
git submodule add -b master https://<PROJECT>.git submodules/<PROJECT>
git submodule init
```

**Note**: git tracks the submodules in a `.gitmodules` file.

## Getting/updating a submodule

After doing a check-out of the parent project, for example.

```bash
git submodule init
```

Alternatively, use the `--recursive` option when cloning:
(`--jobs 8` requests parallel installs to take place)

```
git clone --recursive --jobs 8 <URL TO GIT REPO>
```

## Pulling changes in the main module and the submodules

```bash
git pull --recurse-submodules
```

## Manually updating the submodule

```bash
git submodule update --remote
```
