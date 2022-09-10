# imports-transpiler
Compiler plugin for tstl to make imports working in NanosWorld.

This package translates the imports on typescript eg:
```ts
import thing from "./mySuperThings/thing.ts"
import {stuff} from "./mySuperThings/thing.ts"
import thing, {stuff} from "./mySuperThings/thing.ts"
```

Into Package.Require used by NanosWorld sandbox.

