// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Configuration, OpenAIApi, CreateChatCompletionRequest } from "openai";

const configuration = new Configuration({
	apiKey: vscode.workspace.getConfiguration('gpt-code-optimizer').secretApiKey,
});

const openai = new OpenAIApi(configuration);

function getActiveEditorContent(): string | null {
	const editor = vscode.window.activeTextEditor;
	return editor ? editor.document.getText() : null;
}

async function getOptimizedCode(code: string): Promise<string> {
	const completionRequest: CreateChatCompletionRequest = {
	  model: vscode.workspace.getConfiguration('gpt-code-optimizer').modelType,
	  messages: [{role: "user", content: `${vscode.workspace.getConfiguration('gpt-code-optimizer').promptSetup}${code}`}],
	  temperature: vscode.workspace.getConfiguration('gpt-code-optimizer').temperature,
	  max_tokens: vscode.workspace.getConfiguration('gpt-code-optimizer').maxTokens
	};
  
	const response = await openai.createChatCompletion(completionRequest);
  
	return response.data.choices[0].message.content.trim();
}

async function openNewTabWithOptimizedCode(optimizedCode: string) {
	const doc = await vscode.workspace.openTextDocument({ language: vscode.window.activeTextEditor?.document.languageId, content: optimizedCode });
	
	await vscode.window.showTextDocument(doc, { preserveFocus: true, preview: true, viewColumn: vscode.ViewColumn.Beside });
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "gpt-code-optimizer" is now active!');
	// console.log(vscode.workspace.getConfiguration('gpt-code-optimizer'));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('gpt-code-optimizer.optimizeCode', async () => {
		const code = getActiveEditorContent();
	
		if (code) {
			// const optimizedCode = await getOptimizedCode(code);
			const optimizedCode = code;
			openNewTabWithOptimizedCode(optimizedCode);
		}
	});
	
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
