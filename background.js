chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "save_as_png",
      title: "Save as PNG",
      contexts: ["image"]
    });
    chrome.contextMenus.create({
      id: "save_as_jpg",
      title: "Save as JPG",
      contexts: ["image"]
    });
    chrome.contextMenus.create({
      id: "save_as_jpeg",
      title: "Save as JPEG",
      contexts: ["image"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId.startsWith("save_as_")) {
      const format = info.menuItemId.split("_").pop();
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      
      let baseName = "image";
      try {
        const urlObj = new URL(info.srcUrl);
        if (urlObj.protocol !== 'data:') {
          const filePart = urlObj.pathname.split('/').pop(); 
          if (filePart) {
            const lastDotIndex = filePart.lastIndexOf('.');
            baseName = lastDotIndex > 0 ? filePart.substring(0, lastDotIndex) : filePart;
          }
        }
      } catch (e) {
        console.warn("Could not parse URL for filename, using default.");
      }
      
      baseName = decodeURIComponent(baseName).replace(/[^a-zA-Z0-9_\- ]/g, '_');
      if (!baseName.trim()) baseName = "image";
  
      try {
        const response = await fetch(info.srcUrl);
        const blob = await response.blob();
  
        const bitmap = await createImageBitmap(blob);
  
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0);
  
        const newBlob = await canvas.convertToBlob({ type: mimeType, quality: 1 });
  
        const reader = new FileReader();
        reader.onloadend = function() {
          const dataUrl = reader.result;
          
          chrome.downloads.download({
            url: dataUrl,
            filename: `${baseName}.${format}`,
            saveAs: true 
          });
        };
        reader.readAsDataURL(newBlob);
  
      } catch (error) {
        console.error("Failed to convert and save image:", error);
      }
    }
  });