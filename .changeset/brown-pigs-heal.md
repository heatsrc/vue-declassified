---
"@heatsrc/vuedc": major
---

Add flag to ignore collisions when detected and continue writing output

BREAKING CHANGE:

- The cli will now not write the output Vue file when collisions have been detected, instead it will output and error to the console
- The `--ignore-collisions` flag will behave as in previous versions where the warning is just printed in the script tag of the output Vue file.
