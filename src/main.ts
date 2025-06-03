import { Plugin, MarkdownPostProcessorContext, Notice } from "obsidian";
import mermaid from "mermaid";

export default class MermaidRenderer extends Plugin {
	private mermaidInitialized = false;

	async onload() {
		console.log("Loading MermaidRenderer Plugin");

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
			// Initialize Mermaid with custom config
			mermaid.initialize({
				startOnLoad: false,
				theme: document.body.classList.contains("theme-dark")
					? "dark"
					: "default",
				securityLevel: "loose",
				fontFamily: "var(--font-interface)",
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
			console.log("Mermaid initialized successfully");
		} catch (error) {
			console.error("Failed to initialize Mermaid:", error);
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
			container.innerHTML = svg;

			// Add some styling
			container.style.textAlign = "center";
			container.style.margin = "1em 0";

			// Make SVG responsive
			const svgElement = container.querySelector("svg");
			if (svgElement) {
				svgElement.style.maxWidth = "100%";
				svgElement.style.height = "auto";
			}

			// Optional: Add export functionality
			this.addExportFunctionality(container, id, ctx);
		} catch (error) {
			console.error("Mermaid rendering error:", error);

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
		// Add export button that appears on hover
		const exportBtn = container.createEl("button", {
			text: "💾 Export",
			cls: "mermaid-export-btn",
		});

		exportBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            opacity: 0;
            transition: opacity 0.2s;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 12px;
            cursor: pointer;
        `;

		container.style.position = "relative";

		container.addEventListener("mouseenter", () => {
			exportBtn.style.opacity = "1";
		});

		container.addEventListener("mouseleave", () => {
			exportBtn.style.opacity = "0";
		});

		exportBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this.showExportMenu(container, diagramId, context);
		});
	}

	showExportMenu(
		container: HTMLElement,
		diagramId: string,
		context: MarkdownPostProcessorContext,
	) {
		// Create a simple export menu
		const menu = container.createEl("div", {
			cls: "mermaid-export-menu",
		});

		menu.style.cssText = `
            position: absolute;
            top: 30px;
            right: 5px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            padding: 8px;
            box-shadow: var(--shadow-s);
            z-index: 1000;
        `;

		const svgBtn = menu.createEl("button", {
			text: "Export as SVG",
			cls: "mermaid-export-option",
		});

		const pngBtn = menu.createEl("button", {
			text: "Export as PNG",
			cls: "mermaid-export-option",
		});

		// Style the buttons
		[svgBtn, pngBtn].forEach((btn) => {
			btn.style.cssText = `
                display: block;
                width: 100%;
                padding: 4px 8px;
                margin: 2px 0;
                background: transparent;
                border: none;
                cursor: pointer;
                text-align: left;
                border-radius: 2px;
            `;

			btn.addEventListener("mouseenter", () => {
				btn.style.background = "var(--background-modifier-hover)";
			});

			btn.addEventListener("mouseleave", () => {
				btn.style.background = "transparent";
			});
		});

		svgBtn.addEventListener("click", () => {
			this.exportAsSVG(container, diagramId, context);
			menu.remove();
		});

		pngBtn.addEventListener("click", async () => {
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
			console.log("SVG exported successfully to:", filePath);
		} catch (error) {
			console.error("Failed to export SVG:", error);
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
								console.log(
									"PNG exported successfully to:",
									filePath,
								);
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
			console.error("Failed to export PNG:", error);
			new Notice("Failed to export PNG: " + error.message);
		}
	}

	onunload() {
		console.log("Unloading MermaidRenderer Plugin");
	}
}
