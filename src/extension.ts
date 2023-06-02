import * as vscode from 'vscode';
import axios from 'axios';
import { Configuration, OpenAIApi, CreateChatCompletionRequest } from "openai";

let configuration = null;
let openai = null;
let licenseKey = null;
let isLicenseValid = false;

const promptSetupConfig = vscode.workspace.getConfiguration('gpt-code-optimizer').inspect('promptSetup');
const defaultPrompt = promptSetupConfig?.defaultValue;
const modelTypeConfig = vscode.workspace.getConfiguration('gpt-code-optimizer').inspect('modelType');
const defaultModel = modelTypeConfig?.defaultValue;
const temperatureConfig = vscode.workspace.getConfiguration('gpt-code-optimizer').inspect('temperature');
const defaultTemp = temperatureConfig?.defaultValue;

let promptSetup = defaultPrompt;
let modelType = defaultModel;
let temperature = defaultTemp;

let isCommandRunning = false; // Flag to indicate whether the command is currently running

async function validateLicenseKey(licenseKey: string): Promise<boolean> {
	// try {
	//   const response = await axios.post('https://your-api.com/validate-license', { licenseKey });
	//   return response.data.isValid;
	// } catch (error) {
	//   console.error('Error validating license key:', error);
	//   return false;
	// }
	return false;
}

function getActiveEditorContent(): string | null {
	const editor = vscode.window.activeTextEditor;
	return editor ? editor.document.getText() : null;
}

async function getOptimizedCode(code: string): Promise<string> {
	const completionRequest: CreateChatCompletionRequest = {
	  model: `${modelType}`,
	  messages: [{role: "user", content: `${promptSetup}${code}`}],
	  temperature: parseFloat(`${temperature}`),
	  max_tokens: vscode.workspace.getConfiguration('gpt-code-optimizer').maxTokens
	};
	const response = await openai.createChatCompletion(completionRequest);
	return response.data.choices[0].message.content.trim();
}

async function openNewTabWithOptimizedCode(optimizedCode: string) {
	const doc = await vscode.workspace.openTextDocument({ language: vscode.window.activeTextEditor?.document.languageId, content: optimizedCode });
	await vscode.window.showTextDocument(doc, { preserveFocus: true, preview: true, viewColumn: vscode.ViewColumn.Beside });
}

function initializeOpenAI() {
	licenseKey = vscode.workspace.getConfiguration('gpt-code-optimizer').licenseKey;
	if (licenseKey !== ''){
		validateLicenseKey(licenseKey)
		.then(res=>{
			if (res === true) {
				isLicenseValid = true;
				modelType = vscode.workspace.getConfiguration('gpt-code-optimizer').modelType;
				promptSetup = vscode.workspace.getConfiguration('gpt-code-optimizer').promptSetup;
				temperature = vscode.workspace.getConfiguration('gpt-code-optimizer').temperature;
				vscode.window.showInformationMessage('License key verified. Advanced settings enabled');
			} else {
				isLicenseValid = false;
				promptSetup = defaultPrompt;
				modelType = defaultModel;
				temperature = defaultTemp;
				vscode.window.showErrorMessage('Invalid license key. Please enter a valid license key to use advanced features.');
			}
		})
		.catch(err=>{
			isLicenseValid = false;
			promptSetup = defaultPrompt;
			modelType = defaultModel;
			temperature = defaultTemp;
			vscode.window.showErrorMessage('Something went wrong while validating your license key');
		});
	} else {
		isLicenseValid = false;
		promptSetup = defaultPrompt;
		modelType = defaultModel;
		temperature = defaultTemp;
		const options: vscode.MessageOptions = { detail: 'To unlock advanced settings, a license key is required. To purchase one click Ok', modal: true };
		vscode.window.showInformationMessage("You are using the basic version of GPT Code Optimizer.", options, ...["Ok"]).then((item)=>{
			console.log(item);
		});
	}
	

	configuration = new Configuration({
		apiKey: vscode.workspace.getConfiguration('gpt-code-optimizer').secretApiKey,
	});
	
	openai = new OpenAIApi(configuration);
}

export function activate(context: vscode.ExtensionContext) {
	initializeOpenAI();

	let disposable = vscode.commands.registerCommand('gpt-code-optimizer.optimizeCode', async () => {
		if (isCommandRunning) {
			// If the command is already running, do nothing
			return;
		}

		isCommandRunning = true; // Set the flag to indicate that the command is running

		const code = getActiveEditorContent();
		if (code) {
			// Show a loading bar while the code is being optimized
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Optimizing code...",
				cancellable: false
			}, async (progress) => {
				try {
					const optimizedCode = await getOptimizedCode(code);
					openNewTabWithOptimizedCode(optimizedCode);
				} catch (error) {
					// If an error occurs, show an error message to the user
					vscode.window.showErrorMessage('An error occurred while optimizing the code. Please try again.');
				}
			});
		}

		isCommandRunning = false; // Reset the flag when the command is finished
	});
	context.subscriptions.push(disposable);

	// Listen for changes in the settings
	vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration('gpt-code-optimizer')) {
			// If the settings for this extension have changed, reinitialize OpenAI
			initializeOpenAI();
		}
	});
}

export function deactivate() {}
