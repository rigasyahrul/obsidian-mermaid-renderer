import { Plugin, MarkdownPostProcessorContext, Notice } from "obsidian";
import mermaid from "mermaid";

export default class MermaidRenderer extends Plugin {
	private mermaidInitialized = false;

	async onload() {
		// Initialize Mermaid
		await this.initializeMermaid();

		// Register processor for 'mermaidjs' code blocks
		this.registerMarkdownCodeBlockProcessor(
			"mermaidjs",
			(source, el, ctx) => {
				this.renderMermaid(source, el, ctx);
			},
		);
	}

	async initializeMermaid() {
		if (this.mermaidInitialized) return;

		try {
			// Initialize Mermaid with most basic config for true defaults
			mermaid.initialize({
				startOnLoad: false,
				securityLevel: "loose",
				flowchart: {
					useMaxWidth: true,
					htmlLabels: true,
				},
				sequence: {
					useMaxWidth: true,
				},
				gantt: {
					useMaxWidth: true,
				},
			});

			this.mermaidInitialized = true;
		} catch (error) {

		}
	}

	async renderMermaid(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) {
		if (!this.mermaidInitialized) {
			await this.initializeMermaid();
		}

		if (!this.mermaidInitialized) {
			el.createEl("div", {
				text: "Failed to initialize Mermaid library",
				cls: "mermaid-error",
			});
			return;
		}

		try {
			// Create unique ID for this diagram
			const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Create container
			const container = el.createEl("div", {
				cls: "mermaid-container",
			});

			// Clean the source code
			const cleanSource = source.trim();
			if (!cleanSource) {
				throw new Error("Empty Mermaid diagram");
			}

			// Validate syntax first
			const parseResult = await mermaid.parse(cleanSource);
			if (!parseResult) {
				throw new Error("Invalid Mermaid syntax");
			}

			// Render the diagram
			const { svg } = await mermaid.render(id, cleanSource);

			// Parse SVG safely without innerHTML
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
			const svgElement = svgDoc.documentElement;

			if (svgElement && svgElement.tagName === 'svg') {
				// Import the SVG node into the current document
				const importedSvg = document.importNode(svgElement, true);
				container.appendChild(importedSvg);
			} else {
				throw new Error("Failed to render SVG element");
			}

			// Container already has mermaid-container class, SVG is styled via CSS

			// Always add export functionality to every diagram immediately
			this.addExportFunctionality(container, id, ctx);
		} catch (error) {

			// Show error with original source
			const errorContainer = el.createEl("div", {
				cls: "mermaid-error",
			});

			errorContainer.createEl("div", {
				text: `Mermaid Error: ${error.message || "Unknown error"}`,
				cls: "mermaid-error-message",
			});

			const pre = errorContainer.createEl("pre");
			pre.createEl("code", {
				text: source,
				cls: "language-mermaid",
			});
		}
	}

	addExportFunctionality(
		container: HTMLElement,
		diagramId: string,
		context: MarkdownPostProcessorContext,
	) {
		// Check if export button already exists
		if (container.querySelector('.mermaid-export-btn')) {
			return;
		}

		// Add export button that appears on hover
		const exportBtn = container.createEl("button", {
			text: "💾 Export",
			cls: "mermaid-export-btn",
		});

		exportBtn.setAttribute('title', 'Export diagram');

		exportBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.showExportMenu(container, diagramId, context);
		});
	}

	showExportMenu(
		container: HTMLElement,
		diagramId: string,
		context: MarkdownPostProcessorContext,
	) {
		// Remove any existing menu first
		const existingMenu = container.querySelector('.mermaid-export-menu');
		if (existingMenu) {
			existingMenu.remove();
			return;
		}

		// Create a simple export menu
		const menu = container.createEl("div", {
			cls: "mermaid-export-menu",
		});

		const svgBtn = menu.createEl("button", {
			text: "Export as SVG",
			cls: "mermaid-export-option",
		});

		const pngBtn = menu.createEl("button", {
			text: "Export as PNG",
			cls: "mermaid-export-option",
		});

		svgBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.exportAsSVG(container, diagramId, context);
			menu.remove();
		});

		pngBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			await this.exportAsPNG(container, diagramId, context);
			menu.remove();
		});

		// Close menu when clicking outside
		setTimeout(() => {
			const closeMenu = (e: MouseEvent) => {
				if (!menu.contains(e.target as Node)) {
					menu.remove();
					document.removeEventListener("click", closeMenu);
				}
			};
			document.addEventListener("click", closeMenu);
		}, 100);
	}

	async exportAsSVG(
		container: HTMLElement,
		diagramId: string,
		context: MarkdownPostProcessorContext,
	) {
		try {
			const svgElement = container.querySelector("svg");
			if (!svgElement) {
				throw new Error("No SVG element found");
			}

			// Clone the SVG to avoid modifying the original
			const clonedSvg = svgElement.cloneNode(true) as SVGElement;

			// Add XML declaration and proper namespaces
			const svgString = new XMLSerializer().serializeToString(clonedSvg);
			const fullSvgString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;

			// Get the directory of the current file
			const currentFilePath = context.sourcePath || "";
			const currentDir = currentFilePath.includes("/")
				? currentFilePath.substring(0, currentFilePath.lastIndexOf("/"))
				: "";

			// Use Obsidian's file system to save the SVG
			const fileName = `mermaid-diagram-${Date.now()}.svg`;
			const filePath = currentDir
				? `${currentDir}/${fileName}`
				: fileName;

			await this.app.vault.create(filePath, fullSvgString);

			// Show success message
			new Notice(`SVG exported as ${fileName}`);
		} catch (error) {
			new Notice("Failed to export SVG: " + error.message);
		}
	}

	async exportAsPNG(
		container: HTMLElement,
		diagramId: string,
		context: MarkdownPostProcessorContext,
	) {
		try {
			const svgElement = container.querySelector("svg");
			if (!svgElement) {
				throw new Error("No SVG element found");
			}

			// Get the directory of the current file early
			const currentFilePath = context.sourcePath || "";
			const currentDir = currentFilePath.includes("/")
				? currentFilePath.substring(0, currentFilePath.lastIndexOf("/"))
				: "";

			// Get SVG data
			const svgData = new XMLSerializer().serializeToString(svgElement);

			// Create canvas
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				throw new Error("Could not get canvas context");
			}

			// Get computed styles for accurate sizing
			const computedStyle = window.getComputedStyle(svgElement);
			const width =
				parseInt(computedStyle.width) || svgElement.clientWidth || 800;
			const height =
				parseInt(computedStyle.height) ||
				svgElement.clientHeight ||
				600;

			// Set canvas size with higher resolution
			const scale = 2;
			canvas.width = width * scale;
			canvas.height = height * scale;
			ctx.scale(scale, scale);

			// Create image with inline SVG to avoid CORS
			const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

			return new Promise<void>((resolve, reject) => {
				const img = new Image();

				img.onload = async () => {
					try {
						// Fill white background
						ctx.fillStyle = "white";
						ctx.fillRect(0, 0, width, height);

						// Draw the SVG
						ctx.drawImage(img, 0, 0, width, height);

						// Convert canvas to blob
						canvas.toBlob(
							async (blob) => {
								if (!blob) {
									reject(
										new Error("Failed to create PNG blob"),
									);
									return;
								}

								// Convert blob to array buffer for Obsidian
								const arrayBuffer = await blob.arrayBuffer();
								const fileName = `mermaid-diagram-${Date.now()}.png`;
								const filePath = currentDir
									? `${currentDir}/${fileName}`
									: fileName;

								// Save using Obsidian's vault API
								await this.app.vault.createBinary(
									filePath,
									arrayBuffer,
								);

								new Notice(`PNG exported as ${fileName}`);
								resolve();
							},
							"image/png",
							0.95,
						);
					} catch (error) {
						reject(error);
					}
				};

				img.onerror = () => {
					reject(new Error("Failed to load SVG image"));
				};

				img.src = svgDataUri;
			});
		} catch (error) {
			new Notice("Failed to export PNG: " + error.message);
		}
	}



	onunload() {
		// Clean up resources
		this.mermaidInitialized = false;

		// Remove any remaining export menus
		const exportMenus = document.querySelectorAll('.mermaid-export-menu');
		exportMenus.forEach(menu => menu.remove());

		// Remove any remaining export buttons
		const exportBtns = document.querySelectorAll('.mermaid-export-btn');
		exportBtns.forEach(btn => btn.remove());
	}
}
