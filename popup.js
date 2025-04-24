document.addEventListener('DOMContentLoaded', async () => {
    // Get references to elements
    const mainToggle = document.getElementById('mainToggle');
    const sizeSpoofToggle = document.getElementById('sizeSpoofing');
    const mouseSpoofToggle = document.getElementById('mouseSpoofing');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const innerWidthInput = document.getElementById('innerWidth');
    const innerHeightInput = document.getElementById('innerHeight');
    const dprInput = document.getElementById('dpr');
    const colorDepthInput = document.getElementById('colorDepth');
    const exceptionsInput = document.getElementById('exceptions');
    const saveButton = document.getElementById('save');
    const statusMessage = document.getElementById('status');

    // --- Load saved settings ---
    try {
        const saved = await browser.storage.local.get({
            'enabled': false,
            'sizeSpoofing': false,
            'mouseSpoofing': false,
            'width': 1440,
            'height': 900,
            'innerWidth': 1024,
            'innerHeight': 768,
            'dpr': 1,
            'colorDepth': 24,
            'exceptions': ""
        });

        mainToggle.checked = saved.enabled;
        sizeSpoofToggle.checked = saved.sizeSpoofing;
        mouseSpoofToggle.checked = saved.mouseSpoofing;
        widthInput.value = saved.width;
        heightInput.value = saved.height;
        innerWidthInput.value = saved.innerWidth;
        innerHeightInput.value = saved.innerHeight;
        dprInput.value = saved.dpr;
        colorDepthInput.value = saved.colorDepth;
        exceptionsInput.value = saved.exceptions;

        updateInputsState();

    } catch (error) {
        showStatus("Error loading settings.", "error");
    }

    // Update inputs disabled state based on toggles
    function updateInputsState() {
        const isEnabled = mainToggle.checked;
        const isSizeEnabled = isEnabled && sizeSpoofToggle.checked;

        // Disable all if main toggle is off
        sizeSpoofToggle.disabled = !isEnabled;
        mouseSpoofToggle.disabled = !isEnabled;
        exceptionsInput.disabled = !isEnabled;

        // Disable size inputs if size spoofing is off
        widthInput.disabled = !isSizeEnabled;
        heightInput.disabled = !isSizeEnabled;
        innerWidthInput.disabled = !isSizeEnabled;
        innerHeightInput.disabled = !isSizeEnabled;
        dprInput.disabled = !isSizeEnabled;
        colorDepthInput.disabled = !isSizeEnabled;
    }

    // Add event listeners for toggles
    mainToggle.addEventListener('change', updateInputsState);
    sizeSpoofToggle.addEventListener('change', updateInputsState);

    // --- Save settings on button click ---
    saveButton.addEventListener('click', async () => {
        try {
            const settingsToSave = {
                enabled: mainToggle.checked,
                sizeSpoofing: sizeSpoofToggle.checked,
                mouseSpoofing: mouseSpoofToggle.checked,
                width: parseInt(widthInput.value) || 1440,
                height: parseInt(heightInput.value) || 900,
                innerWidth: parseInt(innerWidthInput.value) || 1024,
                innerHeight: parseInt(innerHeightInput.value) || 768,
                dpr: parseFloat(dprInput.value) || 1,
                colorDepth: parseInt(colorDepthInput.value) || 24,
                exceptions: exceptionsInput.value
            };

            await browser.storage.local.set(settingsToSave);
            showStatus("Settings Saved! Reload page to apply.", "success");

        } catch (error) {
            showStatus("Error saving settings.", "error");
        }
    });

    // Helper functions
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.style.color = type === "error" ? "#dc3545" : "var(--success-color)";
        statusMessage.classList.add('show');
        setTimeout(() => {
            statusMessage.classList.remove('show');
            setTimeout(() => { statusMessage.textContent = ''; }, 300);
        }, type === "error" ? 3000 : 2500);
    }

    // Clear status on input
    const allInputs = [mainToggle, sizeSpoofToggle, mouseSpoofToggle, 
                      widthInput, heightInput, innerWidthInput, 
                      innerHeightInput, dprInput, colorDepthInput, 
                      exceptionsInput];
    
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (statusMessage.classList.contains('show')) {
                statusMessage.classList.remove('show');
                setTimeout(() => { statusMessage.textContent = ''; }, 300);
            }
        });
    });
});