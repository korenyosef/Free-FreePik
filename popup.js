document.addEventListener('DOMContentLoaded', async () => {
  const imageList = document.getElementById('image-list');
  const statusLine = document.getElementById('status');

  // Query the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    statusLine.textContent = "Error: Active tab not found.";
    return;
  }

  // Inject the content script if it's not already running
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (err) {
    console.log("Content script injection failed (might be already there):", err);
  }

  // Send message to content script to extract images
  chrome.tabs.sendMessage(tab.id, { action: "extract" }, (response) => {
    if (chrome.runtime.lastError) {
      statusLine.textContent = "Error communicating with tab. Please refresh the page.";
      return;
    }

    if (!response || !response.images || response.images.length === 0) {
      statusLine.textContent = "No images with multiple resolutions found.";
      return;
    }

    statusLine.textContent = `Found ${response.images.length} images.`;
    renderImages(response.images);
  });

  function renderImages(images) {
    imageList.innerHTML = '';
    
    images.forEach((imgData, index) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      
      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'thumbnail-container';
      const thumb = document.createElement('img');
      thumb.src = imgData.thumbnail;
      thumbContainer.appendChild(thumb);
      
      const info = document.createElement('div');
      info.className = 'image-info';
      
      const controls = document.createElement('div');
      controls.className = 'controls';
      
      const select = document.createElement('select');
      imgData.variants.forEach(v => {
        const option = document.createElement('option');
        option.value = v.url;
        option.textContent = v.descriptor;
        select.appendChild(option);
      });
      
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'Download';
      downloadBtn.onclick = () => {
        const selectedUrl = select.value;
        const filename = `extracted_image_${index + 1}_${select.options[select.selectedIndex].text}.jpg`;
        
        chrome.downloads.download({
          url: selectedUrl,
          filename: filename,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError);
            alert("Download failed: " + chrome.runtime.lastError.message);
          }
        });
      };
      
      controls.appendChild(select);
      controls.appendChild(downloadBtn);
      
      info.appendChild(controls);
      
      card.appendChild(thumbContainer);
      card.appendChild(info);
      
      imageList.appendChild(card);
    });
  }
});
