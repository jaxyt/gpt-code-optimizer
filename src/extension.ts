import * as vscode from 'vscode';
import { Configuration, OpenAIApi, CreateChatCompletionRequest } from "openai";

let configuration = null;

let openai = null;

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

export function activate(context: vscode.ExtensionContext) {
	configuration = new Configuration({
		apiKey: vscode.workspace.getConfiguration('gpt-code-optimizer').secretApiKey,
	});
	
	openai = new OpenAIApi(configuration);

	let disposable = vscode.commands.registerCommand('gpt-code-optimizer.optimizeCode', async () => {
		const code = getActiveEditorContent();
		if (code) {
			const optimizedCode = await getOptimizedCode(code);
			// const optimizedCode = code;
			openNewTabWithOptimizedCode(optimizedCode);
		}
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
