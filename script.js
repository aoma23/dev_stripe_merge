let imageCount = 2;
let images = [
    { src: 'sample_a.webp', element: new Image() },
    { src: 'sample_b.webp', element: new Image() }
];
let offsets = [];
let scales = [];

window.onload = function () {
    const verticalButton = document.getElementById('verticalButton');
    const horizontalButton = document.getElementById('horizontalButton');
    const diagonalButton = document.getElementById('diagonalButton');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');

    images.forEach((img, index) => {
        img.element.src = img.src;
        img.element.onload = function () {
            if (index === images.length - 1) updatePreview();
        }
        setupDropZone(index);
    });
    addImage();

    verticalButton.addEventListener('click', () => setAngleAndUpdatePreview(0));
    horizontalButton.addEventListener('click', () => setAngleAndUpdatePreview(90));
    diagonalButton.addEventListener('click', () => setAngleAndUpdatePreview(45));

    document.getElementById('stripeCount').addEventListener('input', updatePreview);
    document.getElementById('angle').addEventListener('input', updatePreview);

    copyButton.addEventListener('click', copyToClipboard);
    downloadButton.addEventListener('click', downloadImage);

    enableCanvasDraggingAndScaling();

    checkScrollBar();
}

function setupDropZone(index) {
    const dropZone = document.getElementById(`dropZone${index}`);
    const imagePreview = document.getElementById(`imagePreview${index}`);
    const inputFile = document.getElementById(`inputFile${index}`);

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');
        handleFile(event.dataTransfer.files[0], imagePreview, index);
    });

    dropZone.addEventListener('click', () => {
        inputFile.click();
    });

    inputFile.addEventListener('change', (event) => {
        handleFile(event.target.files[0], imagePreview, index);
    });
}

function handleFile(file, imagePreview, index) {
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            images[index].element.src = e.target.result;
            images[index].element.onload = updatePreview;

            // <span>要素を削除する
            const dropZone = document.getElementById(`dropZone${index}`);
            const spanElement = dropZone.querySelector('span');
            if (spanElement) {
                dropZone.removeChild(spanElement);
            }
        };
        reader.readAsDataURL(file);
        if (index == images.length - 1) {
            addImage();
        }
    }
}

function addImage() {
    const imageContainer = document.getElementById('imageContainer');
    const newIndex = imageCount;
    const newImagePreviewContainer = document.createElement('div');
    newImagePreviewContainer.classList.add('image-preview-container');
    newImagePreviewContainer.id = `imagePreviewContainer${newIndex}`;

    const newDropZone = document.createElement('div');
    newDropZone.classList.add('drop-zone');
    newDropZone.id = `dropZone${newIndex}`;
    newDropZone.innerHTML = `
        <span>If you want to add an image, click or drop here.</span>
        <img id="imagePreview${newIndex}">
        <input type="file" id="inputFile${newIndex}" accept="image/*">
    `;

    newImagePreviewContainer.appendChild(newDropZone);
    imageContainer.appendChild(newImagePreviewContainer);

    images.push({ src: '', element: new Image() });
    setupDropZone(newIndex);

    imageCount++;
}

function setAngleAndUpdatePreview(angle) {
    document.getElementById('angle').value = angle;
    updatePreview();
}

function updatePreview() {
    const stripeCount = parseInt(document.getElementById('stripeCount').value);
    const angle = parseFloat(document.getElementById('angle').value);

    if (!isNaN(stripeCount)) {
        const activeImages = images.filter(image => image.element.src);
        processImages(activeImages, stripeCount, angle);
    }
}

function processImages(activeImages, stripeCount, angle, ctx = null) {
    if (!ctx) {
        const canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
    }

    const width = activeImages[0].element.width;
    const height = activeImages[0].element.height;

    ctx.canvas.width = width;
    ctx.canvas.height = height;
    const adjustedAngle = adjustAngle(angle);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i <= stripeCount; i++) {
        let img = activeImages[i % activeImages.length].element;
        let offset = offsets[i] || { x: 0, y: 0 };
        let scale = scales[i] || 1;

        ctx.save();
        ctx.beginPath();

        const { x1, y1, x2, y2, x3, y3, x4, y4 } = calculateStripeCoordinates(i, stripeCount, width, height, adjustedAngle);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);

        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, offset.x, offset.y, width * scale, height * scale);
        ctx.restore();
    }
}

function adjustAngle(angle) {
    angle = angle % 360;
    if (angle > 180) {
        return angle - 360;
    } else if (angle < -180) {
        return angle + 360;
    }
    return angle;
}

function calculateStripeCoordinates(i, stripeCount, width, height, angle) {

    let stripeWidth, radians, x1, y1, x2, y2, x3, y3, x4, y4;

    if (angle >= 0 && angle <= 90) {
        radians = angle * Math.PI / 180;
        stripeWidth = (width + height * Math.tan(Math.abs(radians))) / (stripeCount + 1);

        x1 = i * stripeWidth;
        y1 = 0;
        x2 = (i + 1) * stripeWidth;
        y2 = 0;
        x3 = x2 - height * Math.tan(radians);
        y3 = height;
        x4 = x1 - height * Math.tan(radians);
        y4 = height;
    } else if (angle < 0 && angle >= -90) {
        radians = angle * Math.PI / 180;
        stripeWidth = (width + height * Math.tan(Math.abs(radians))) / (stripeCount + 1);
        
        x1 = width - (i * stripeWidth);
        y1 = 0;
        x2 = width - ((i + 1) * stripeWidth);
        y2 = 0;
        x3 = x2 + height * Math.tan(Math.abs(radians));
        y3 = height;
        x4 = x1 + height * Math.tan(Math.abs(radians));
        y4 = height;
    } else if (angle < -90 && angle >= -180) {
        angle = 180 + angle;
        radians = angle * Math.PI / 180;
        stripeWidth = (width + height * Math.tan(Math.abs(radians))) / (stripeCount + 1);

        x1 = i * stripeWidth;
        y1 = 0;
        x2 = (i + 1) * stripeWidth;
        y2 = 0;
        x3 = x2 - height * Math.tan(radians);
        y3 = height;
        x4 = x1 - height * Math.tan(radians);
        y4 = height;
    } else if (angle > 90 && angle <= 180) {
        angle = -180 + angle;
        radians = angle * Math.PI / 180;
        stripeWidth = (width + height * Math.tan(Math.abs(radians))) / (stripeCount + 1);

        x1 = width - (i * stripeWidth);
        y1 = 0;
        x2 = width - ((i + 1) * stripeWidth);
        y2 = 0;
        x3 = x2 + height * Math.tan(Math.abs(radians));
        y3 = height;
        x4 = x1 + height * Math.tan(Math.abs(radians));
        y4 = height;
    }

    return { x1, y1, x2, y2, x3, y3, x4, y4 };
}

function enableCanvasDraggingAndScaling() {
    const canvas = document.getElementById('canvas');
    let isDragging = false;
    let startX, startY, initialX, initialY, stripeIndex;

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        const rect = canvas.getBoundingClientRect();
        const scaleFactor = canvas.width / rect.width;
        stripeIndex = getStripeIndex((event.clientX - rect.left) * scaleFactor, (event.clientY - rect.top) * scaleFactor);
        if (stripeIndex !== null) {
            initialX = offsets[stripeIndex]?.x || 0;
            initialY = offsets[stripeIndex]?.y || 0;
        }
        event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging && stripeIndex !== null) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            offsets[stripeIndex] = { x: initialX + dx, y: initialY + dy };
            updatePreview();
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleFactor = canvas.width / rect.width;
        stripeIndex = getStripeIndex((event.clientX - rect.left) * scaleFactor, (event.clientY - rect.top) * scaleFactor);
        if (stripeIndex !== null) {
            const scale = scales[stripeIndex] || 1;
            const newScale = event.deltaY > 0 ? scale * 0.97 : scale * 1.03; // スケール変更を緩やかにするための調整
            scales[stripeIndex] = newScale;
            updatePreview();
        }
    });
}

function getStripeIndex(x, y) {
    const stripeCount = parseInt(document.getElementById('stripeCount').value);
    const angle = parseFloat(document.getElementById('angle').value);

    const radians = angle * Math.PI / 180;
    const stripeWidth = (images[0].element.width + images[0].element.height * Math.tan(Math.abs(radians))) / (stripeCount + 1);

    for (let i = 0; i <= stripeCount; i++) {
        const { x1, y1, x2, y2, x3, y3, x4, y4 } = calculateStripeCoordinates(i, stripeCount, images[0].element.width, images[0].element.height, angle);
        if (isPointInPolygon([x1, y1, x2, y2, x3, y3, x4, y4], x, y)) {
            return i;
        }
    }

    return null;
}

function isPointInPolygon(points, x, y) {
    let inside = false;
    for (let i = 0, j = points.length / 2 - 1; i < points.length / 2; j = i++) {
        const xi = points[i * 2], yi = points[i * 2 + 1];
        const xj = points[j * 2], yj = points[j * 2 + 1];

        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function copyToClipboard() {
    const canvas = document.getElementById('canvas');
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = images[0].element.width;
    tempCanvas.height = images[0].element.height;
    const tempCtx = tempCanvas.getContext('2d');

    const stripeCount = parseInt(document.getElementById('stripeCount').value);
    const angle = parseFloat(document.getElementById('angle').value);

    const activeImages = images.filter(image => image.element.src);
    processImages(activeImages, stripeCount, angle, tempCtx);

    tempCanvas.toBlob(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);
    });
}

function downloadImage() {
    const canvas = document.getElementById('canvas');
    const originalWidth = images[0].element.width;
    const originalHeight = images[0].element.height;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;

    const stripeCount = parseInt(document.getElementById('stripeCount').value);
    const angle = parseFloat(document.getElementById('angle').value);

    const activeImages = images.filter(image => image.element.src);
    processImages(activeImages, stripeCount, angle, tempCtx);

    const link = document.createElement('a');
    link.download = 'merged_image.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

function adjustImageContainerAlignment() {
    const container = document.getElementById('imageContainer');
    if (container.scrollWidth > container.clientWidth) {
        // 画像が多くて横スクロールバーが表示された時は左寄せにしないと左側が見切れてしまうのでその対応。
        container.style.justifyContent = 'flex-start';
    } else {
        container.style.justifyContent = 'center';
    }
}

function checkScrollBar() {
    // 初回チェック
    window.addEventListener('load', adjustImageContainerAlignment);

    // 画像が追加されたときのチェック
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.addEventListener('DOMNodeInserted', adjustImageContainerAlignment);

    // ウィンドウサイズが変更されたときのチェック
    window.addEventListener('resize', adjustImageContainerAlignment);
}