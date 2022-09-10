
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
//@ts-ignore
console.log("Imports transpiller starting");

let importMapsCount = 0;

interface IModuleImportClause {
    exportedName: string;
    importVarName: string;
};

interface IModuleImportNode {
    defaultImport?: IModuleImportClause;
    namedImports?: IModuleImportClause[];
}

const plugin: tstl.Plugin = {
    visitors: {
        [ts.SyntaxKind.ImportDeclaration]: (node) => {
            // Find the name of the File
            const identifier = (node.moduleSpecifier as any).text; // Any => They hack the types so I hack the types too
            if (identifier.toLowerCase().includes("nanosts")) {
                return [];
            }

            ++importMapsCount;
            const importMapName = "____importmap_"+importMapsCount;
            // TODO: Handle external Lua package with type definitions
            // TODO: Handle index.ts being stripped from the import path

            const targetModulePath = identifier + ".lua";

            // List all the imports done
            const defaultBinding = node.importClause.name;
            const namedBindings = (node.importClause?.namedBindings as any)?.elements

            // Build internal transpiller representation
            const nodeRepr: IModuleImportNode = {
                defaultImport: defaultBinding ? {
                    exportedName: 'default',
                    importVarName: defaultBinding?.getText()
                } : undefined,
                namedImports: namedBindings?.map((chNode) => {
                    const named =  chNode.getText()
                    return {
                        exportedName: named,
                        importVarName: named
                    }
                })
            }

            // console.log("Node repr: ", nodeRepr);

            // Create LUA AST Nodes
            // Package.Require Node
            const packageRequireAssignToImportMap = tstl.createVariableDeclarationStatement(tstl.createIdentifier(importMapName), tstl.createIdentifier(`Package.Require("${targetModulePath}")`))

            // Named imports
            const finalNamedImportsVariables = [...nodeRepr.namedImports ?? [], nodeRepr.defaultImport].map((moduleImportClause) => {
                // console.log("Processing : ", moduleImportClause)
                if (!moduleImportClause) return;
                return tstl.createVariableDeclarationStatement(tstl.createIdentifier(moduleImportClause.importVarName), tstl.createIdentifier(importMapName + "." + moduleImportClause.exportedName))
            }).reduce((acc, v) => v ? [...acc, v] : acc, [])

            // console.log("Final ", finalNamedImportsVariables)
            return [packageRequireAssignToImportMap, ...finalNamedImportsVariables];

        },
    }
}
//@ts-ignore
console.log("Imports transpiller done");

export default plugin;