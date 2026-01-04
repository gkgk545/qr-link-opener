import jsQR from 'jsqr';
import './styles.css';

let isScanning = false;
let overlay: HTMLElement | null = null;
let selectionBox: HTMLElement | null = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TOGGLE_SCAN') {
        toggleScan();
    }
});

function toggleScan() {
    if (isScanning) {
        removeOverlay();
    } else {
        createOverlay();
    }
}

function createOverlay() {
    if (document.getElementById('qr-selection-overlay')) return;

    isScanning = true;
    overlay = document.createElement('div');
    overlay.id = 'qr-selection-overlay';

    selectionBox = document.createElement('div');
    selectionBox.id = 'qr-selection-box';
    overlay.appendChild(selectionBox);

    document.body.appendChild(overlay);

    overlay.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
}

function removeOverlay() {
    isScanning = false;
    isSelecting = false;
    if (overlay) {
        overlay.removeEventListener('mousedown', onMouseDown);
        overlay.remove();
        overlay = null;
        selectionBox = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        removeOverlay();
    }
}

function onMouseDown(e: MouseEvent) {
    if (!overlay || !selectionBox) return;
    e.preventDefault();
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent) {
    if (!isSelecting || !selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
}

function onMouseUp(_e: MouseEvent) {
    if (!isSelecting) return;
    isSelecting = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (!selectionBox) return;

    const rect = selectionBox.getBoundingClientRect();

    // Minimal size check
    if (rect.width < 10 || rect.height < 10) {
        removeOverlay();
        return;
    }

    // Hide overlay temporarily to not capture it? 
    // Actually captureVisibleTab captures the rendered tab. The overlay is semi-transparent.
    // It might interfere with QR detection if the overlay color blends with the QR code.
    // Best to hide the overlay before capture or ensure the QR is visible.
    // Disabling the overlay display before capture is faster.
    overlay!.style.display = 'none';

    // Wait a bit for render update? Usually captureVisibleTab captures what is on screen.
    // If we hide it, we might need a small delay or rely on the fact that the message handling is async.

    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'CAPTURE_AREA' }, (response) => {
            if (response && response.dataUrl) {
                processCapture(response.dataUrl, rect);
            } else {
                alert('화면 캡처에 실패했습니다.');
                removeOverlay();
            }
        });
    }, 50);
}

function processCapture(dataUrl: string, rect: DOMRect) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Device Pixel Ratio handling?
        // captureVisibleTab usually returns valid image size. 
        // We need to map `rect` (viewport coords) to image coords.
        // If the screenshot is full size, we need to account for logic.
        // Usually capture comes at device resolution.

        // Device Pixel Ratio can be ignored as captureVisibleTab captures rendered pixels
        // const dpr = window.devicePixelRatio || 1;
        // However, chrome.tabs.captureVisibleTab usually returns an image scaled to the screen width/height * dpr?
        // Or sometimes just 1x. It depends on Chrome settings.
        // We can check img.width vs window.innerWidth.

        const scaleX = img.width / window.innerWidth;
        const scaleY = img.height / window.innerHeight;

        canvas.width = rect.width * scaleX;
        canvas.height = rect.height * scaleY;

        ctx.drawImage(img,
            rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY,
            0, 0, canvas.width, canvas.height
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        removeOverlay(); // Clean up

        if (code) {
            if (code.data.startsWith('http')) {
                window.open(code.data, '_blank');
            } else {
                alert(`QR 코드 내용: ${code.data}`);
            }
        } else {
            alert('QR 코드를 찾을 수 없습니다.');
        }
    };
    img.src = dataUrl;
}
