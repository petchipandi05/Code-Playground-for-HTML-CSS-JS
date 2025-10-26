// Editor functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const htmlEditor = document.getElementById('html-code');
    const cssEditor = document.getElementById('css-code');
    const jsEditor = document.getElementById('js-code');
    const outputIframe = document.getElementById('output-iframe');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearBtn = document.getElementById('clear-btn');
    const livePreviewToggle = document.getElementById('live-preview');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const editors = document.querySelectorAll('.code-editor');
    const outputTabs = document.querySelectorAll('.output-tab');
    const outputPanels = document.querySelectorAll('.output-panel');
    const consoleOutput = document.getElementById('console-output');
    const clearConsoleBtn = document.getElementById('clear-console');
    
    // Default code samples
    const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Code</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to the code editor. Start coding!</p>
</body>
</html>`;

    const defaultCSS = `body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2563eb;
}`;

    const defaultJS = `// Your JavaScript code here
console.log("Script loaded!");

// Example function
function greet() {
    console.log("Hello from JavaScript!");
}

// Call the function
greet();`;

    // Initialize editors
    function initEditors() {
        htmlEditor.value = defaultHTML;
        cssEditor.value = defaultCSS;
        jsEditor.value = defaultJS;
        updateLineNumbers();
        runCode();
    }

    // Tab switching logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show the corresponding editor
            editors.forEach(editor => {
                editor.classList.remove('active');
                if (editor.id === `${target}-editor`) {
                    editor.classList.add('active');
                }
            });
        });
    });

    // Output tabs switching
    outputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.output;
            
            // Update active tab
            outputTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show the corresponding panel
            outputPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${target}-panel`) {
                    panel.classList.add('active');
                }
            });
            
            // Clear new message indicator
            tab.classList.remove('has-new');
        });
    });

    // Line numbers
    function updateLineNumbers() {
        const editors = [
            { textarea: htmlEditor, container: document.querySelector('#html-editor .line-numbers') },
            { textarea: cssEditor, container: document.querySelector('#css-editor .line-numbers') },
            { textarea: jsEditor, container: document.querySelector('#js-editor .line-numbers') }
        ];
        
        editors.forEach(({ textarea, container }) => {
            const lineCount = textarea.value.split('\n').length;
            let linesHtml = '';
            
            for (let i = 1; i <= lineCount; i++) {
                linesHtml += `<div>${i}</div>`;
            }
            
            container.innerHTML = linesHtml;
            
            // Sync scrolling
            textarea.addEventListener('scroll', () => {
                container.scrollTop = textarea.scrollTop;
            });
        });
    }

    // Run code function
    function runCode() {
        const html = htmlEditor.value;
        const css = cssEditor.value;
        const js = jsEditor.value;
        
        // Clear console before each run
        consoleOutput.innerHTML = '';
        
        // Create document for iframe
        const iframe = outputIframe;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Clear previous iframe content
        iframeDoc.open();
        
        // Write base HTML
        iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${css}</style>
            </head>
            <body>${html}</body>
            </html>
        `);
        
        iframeDoc.close();
        
        // Handle console logging
        const iframeWindow = iframe.contentWindow;
        
        // Save original console methods
        const originalLog = iframeWindow.console.log;
        const originalError = iframeWindow.console.error;
        const originalWarn = iframeWindow.console.warn;
        const originalInfo = iframeWindow.console.info;
        
        // Override console methods
        iframeWindow.console.log = function(...args) {
            addToConsole('log', args);
            originalLog.apply(iframeWindow.console, args);
        };
        
        iframeWindow.console.error = function(...args) {
            addToConsole('error', args);
            originalError.apply(iframeWindow.console, args);
        };
        
        iframeWindow.console.warn = function(...args) {
            addToConsole('warn', args);
            originalWarn.apply(iframeWindow.console, args);
        };
        
        iframeWindow.console.info = function(...args) {
            addToConsole('info', args);
            originalInfo.apply(iframeWindow.console, args);
        };
        
        // Set up error handling
        iframeWindow.onerror = function(message, source, lineno, colno, error) {
            addToConsole('error', [`Error: ${message} (line ${lineno})`]);
            return true;
        };
        
        // Execute JS code
        try {
            const scriptElement = iframeDoc.createElement('script');
            scriptElement.textContent = js;
            iframeDoc.body.appendChild(scriptElement);
        } catch (error) {
            addToConsole('error', [`Script error: ${error.message}`]);
        }
    }
    
    // Helper function to add messages to console
    function addToConsole(type, args) {
        const messageEl = document.createElement('div');
        messageEl.classList.add(type);
        
        // Format arguments
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        messageEl.textContent = `> ${formattedArgs}`;
        consoleOutput.appendChild(messageEl);
        
        // Scroll to bottom
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        
        // If console tab is not active, indicate new messages
        const consoleTab = document.querySelector('[data-output="console"]');
        if (!consoleTab.classList.contains('active')) {
            consoleTab.classList.add('has-new');
        }
    }

    // Debounce function to prevent too many updates
    function debounce(func, wait) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), wait);
        };
    }

    const runCodeDebounced = debounce(runCode, 500);

    // Event listeners
    runBtn.addEventListener('click', () => {
        runCode();
    });
    
    resetBtn.addEventListener('click', () => {
        initEditors();
    });
    
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all code?')) {
            htmlEditor.value = '';
            cssEditor.value = '';
            jsEditor.value = '';
            updateLineNumbers();
            runCode();
        }
    });
    
    clearConsoleBtn.addEventListener('click', () => {
        consoleOutput.innerHTML = '';
    });
    
    // Update line numbers on input
    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.addEventListener('input', updateLineNumbers);
        
        // Handle tab key for indentation
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                
                // Insert tab character
                editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
                
                // Move cursor position
                editor.selectionStart = editor.selectionEnd = start + 4;
            }
        });
    });
    
    // Live preview toggle
    livePreviewToggle.addEventListener('change', () => {
        if (livePreviewToggle.checked) {
            // Enable live preview (code runs on every change)
            [htmlEditor, cssEditor, jsEditor].forEach(editor => {
                editor.addEventListener('input', runCodeDebounced);
            });
        } else {
            // Disable live preview
            [htmlEditor, cssEditor, jsEditor].forEach(editor => {
                editor.removeEventListener('input', runCodeDebounced);
            });
        }
    });

    // Initialize on load
    initEditors();
    
    // Enable live preview by default
    if (livePreviewToggle.checked) {
        [htmlEditor, cssEditor, jsEditor].forEach(editor => {
            editor.addEventListener('input', runCodeDebounced);
        });
    }
});
