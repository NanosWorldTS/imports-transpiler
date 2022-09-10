# imports-transpiler
Compiler plugin for tstl to make imports working in NanosWorld.

This package translates the imports on typescript eg:
```ts
import thing from "./mySuperThings/thing1.ts"
import {stuff} from "./mySuperThings/thing2.ts"
import thing, {stuff} from "./mySuperThings/thing3.ts"
```

Into Package.Require used by NanosWorld sandbox.
```lua
local ____importmap_1 = Package.Require("./mySuperThings/thing1.lua")
local thing = ____importmap_1.default
local ____importmap_2 = Package.Require("./mySuperThings/thing2.lua")
local stuff = ____importmap_2.stuff
local ____importmap_3 = Package.Require("./mySuperThings/thing3.lua")
local thing = ____importmap_3.default
local stuff = ____importmap_3.stuff
```
