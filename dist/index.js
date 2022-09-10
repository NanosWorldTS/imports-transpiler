"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const tstl = __importStar(require("typescript-to-lua"));
//@ts-ignore
console.log("Imports transpiller starting");
let importMapsCount = 0;
;
const plugin = {
    visitors: {
        [ts.SyntaxKind.ImportDeclaration]: (node) => {
            // Find the name of the File
            const identifier = node.moduleSpecifier.text; // Any => They hack the types so I hack the types too
            if (identifier.toLowerCase().includes("nanosts")) {
                return [];
            }
            ++importMapsCount;
            const importMapName = "____importmap_" + importMapsCount;
            // TODO: Handle external Lua package with type definitions
            // TODO: Handle index.ts being stripped from the import path
            const targetModulePath = identifier + ".lua";
            // List all the imports done
            const defaultBinding = node.importClause?.name;
            const namedBindings = node.importClause?.namedBindings?.elements;
            // Build internal transpiller representation
            const nodeRepr = {
                defaultImport: defaultBinding ? {
                    exportedName: 'default',
                    importVarName: defaultBinding?.getText()
                } : undefined,
                namedImports: namedBindings?.map((chNode) => {
                    const named = chNode.getText();
                    return {
                        exportedName: named,
                        importVarName: named
                    };
                })
            };
            // console.log("Node repr: ", nodeRepr);
            // Create LUA AST Nodes
            // Package.Require Node
            const packageRequireAssignToImportMap = tstl.createVariableDeclarationStatement(tstl.createIdentifier(importMapName), tstl.createIdentifier(`Package.Require("${targetModulePath}")`));
            // Named imports
            const finalNamedImportsVariables = [...nodeRepr.namedImports ?? [], nodeRepr.defaultImport].map((moduleImportClause) => {
                // console.log("Processing : ", moduleImportClause)
                if (!moduleImportClause)
                    return;
                return tstl.createVariableDeclarationStatement(tstl.createIdentifier(moduleImportClause.importVarName), tstl.createIdentifier(importMapName + "." + moduleImportClause.exportedName));
            })?.reduce((acc, v) => v ? [...acc, v] : acc, []);
            // console.log("Final ", finalNamedImportsVariables)
            return [packageRequireAssignToImportMap, ...finalNamedImportsVariables];
        },
    }
};
//@ts-ignore
console.log("Imports transpiller done");
exports.default = plugin;
