import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import * as path from "node:path";
import * as fs from "node:fs";
import {VariableDeclarationStatement} from "typescript-to-lua";

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

            // Tries to import the file directly, if it is not found its probably an import from an "index.ts"
            const importerFile = (node as any)?.parent.fileName;
            let targetModulePath;
            const importerDir = path.dirname(importerFile);
            const directSourceFilePath = path.format({dir: importerDir, base: identifier + ".ts"});
            try {
                fs.statSync(directSourceFilePath)
                targetModulePath = identifier + ".lua";
            } catch(e) {
                targetModulePath = identifier + "/index.lua";
            }

            // List all the imports done
            const defaultBinding = node.importClause?.name;
            const namedBindings = (node.importClause?.namedBindings as any)?.elements

            // Build internal transpiller representation and sort default import and named imports
            const nodeRepr: IModuleImportNode = {
                defaultImport: defaultBinding ? {
                    exportedName: 'default',
                    importVarName: defaultBinding?.getText()
                } : undefined,
                namedImports: namedBindings?.map((chNode: any) => {
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

            // Imports
            const finalNamedImportsVariables: VariableDeclarationStatement[] = [...nodeRepr.namedImports ?? [], nodeRepr.defaultImport].map((moduleImportClause) => {
                // console.log("Processing : ", moduleImportClause)
                if (!moduleImportClause) return;
                return tstl.createVariableDeclarationStatement(tstl.createIdentifier(moduleImportClause.importVarName), tstl.createIdentifier(importMapName + "." + moduleImportClause.exportedName))
            })?.reduce((acc, v) => v ? [...acc, v] : acc, [] as VariableDeclarationStatement[])

            // console.log("Final ", finalNamedImportsVariables)
            return [packageRequireAssignToImportMap, ...finalNamedImportsVariables];

        },
    }
}
//@ts-ignore
console.log("Imports transpiller done");

export default plugin;