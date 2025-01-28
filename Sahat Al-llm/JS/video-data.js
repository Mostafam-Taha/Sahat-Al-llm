    // تحميل الفيديوهات المحفوظة من localStorage عند فتح الصفحة
    document.addEventListener("DOMContentLoaded", loadVideoHistory);

    function addVideo() {
      const inputLink = document.getElementById("youtube-link").value;

      // استخراج Video ID من الرابط
      const videoId = extractVideoId(inputLink);

      if (videoId) {
        // عرض الفيديو الحالي
        displayVideo(videoId);

        // حفظ الفيديو في السجل
        saveVideoToHistory(videoId);

        // تحديث سجل الفيديوهات
        loadVideoHistory();
      } else {
        alert("يرجى إدخال رابط YouTube صحيح.");
      }
    }

    function extractVideoId(url) {
      const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)/;
      const match = url.match(regex);
      return match ? match[1] || match[2] : null;
    }

    function displayVideo(videoId) {
        const videoContainer = document.getElementById("video-container");
        videoContainer.innerHTML = `
          <iframe class="view-youtube" 
                  src="https://www.youtube.com/embed/${videoId}" 
                  title="YouTube video player" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
        `;
      
        // تحميل البيانات الإضافية بعد عرض الفيديو
        loadVideoData(videoId);
      }
      

    function saveVideoToHistory(videoId) {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];

      // إضافة الفيديو الجديد إلى السجل إذا لم يكن موجود
    if (!videoHistory.some(video => video.id === videoId)) {
        videoHistory.push({ id: videoId, views: 0, favorite: false });
        localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
      }
    }

    function loadVideoHistory() {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];
  const historyContainer = document.getElementById("video-history");

  historyContainer.innerHTML = "";

      videoHistory.forEach((video, index) => {
    const videoItem = document.createElement("div");
    videoItem.className = "video-item";
    videoItem.innerHTML = `
      <div class="view-video">
        <span onclick="viewVideo('${video.id}')">شاهد الفيديو: ${video.id}</span>
            <span class="${video.favorite ? 'favorite' : ''}" onclick="toggleFavorite(${index})"> ★</span>
            <span class="delete" onclick="deleteVideo(${index})">حذف</span>
        <span> المشاهدات: ${video.views}</span>
      </div>
    `;
    historyContainer.appendChild(videoItem);
  });
}

function viewVideo(videoId) {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];
      const video = videoHistory.find(video => video.id === videoId);
    if (video) {
      video.views += 1; // زيادة عدد المشاهدات
        localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
        displayVideo(videoId);
        }
    }

    function toggleFavorite(index) {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];
      videoHistory[index].favorite = !videoHistory[index].favorite;
      localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
      loadVideoHistory(); // إعادة تحميل السجل لتحديث المفضلة
    }

    function deleteVideo(index) {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];
      videoHistory.splice(index, 1); // حذف الفيديو من السجل
      localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
      loadVideoHistory(); // إعادة تحميل السجل بعد الحذف
    }

    function playRandomVideo() {
      const videoHistory = JSON.parse(localStorage.getItem("videoHistory")) || [];
      if (videoHistory.length > 0) {
        const randomVideo = videoHistory[Math.floor(Math.random() * videoHistory.length)];
        displayVideo(randomVideo.id);
      } else {
        alert("لا توجد فيديوهات في السجل.");
      }
}

// تحميل البيانات من ملف JSON
async function loadVideoData(videoId) {
    try {
      const response = await fetch('JSON/video-data.json');
      const data = await response.json();
  
      const videoData = data.find(video => video.id === videoId);
      if (videoData) {
        displayAdditionalData(videoData);
      } else {
        console.log("لم يتم العثور على بيانات إضافية لهذا الفيديو.");
      }
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error);
    }
  }
  
  // عرض البيانات الإضافية
  function displayAdditionalData(videoData) {
    const videoContainer = document.getElementById("video-container");
  
    const additionalInfo = document.createElement("div");
    additionalInfo.className = "additional-info";
  
    // إضافة الوصف
    additionalInfo.innerHTML += `
      <p><strong>: وصف </strong> <div class="text-tube">${videoData.description}</div></p><hr>
    `;
  
    // إضافة الصور
    if (videoData.images && videoData.images.length > 0) {
      additionalInfo.innerHTML += `<strong></strong><br>`;
      videoData.images.forEach(image => {
        additionalInfo.innerHTML += `<img src="images/${image}" alt="صورة الفيديو" width="100"><br>`;
      });
    }
  
    // إضافة ملفات PDF
    if (videoData.pdfs && videoData.pdfs.length > 0) {
      additionalInfo.innerHTML += `<hr><br>`;
      videoData.pdfs.forEach(pdf => {
        additionalInfo.innerHTML += `<a href="pdfs/${pdf}" download="tutorial1.mp4">تحميل ${pdf}</a><br>`;

      });
    }
  
    // إضافة البيانات الإضافية إلى الفيديو
    videoContainer.appendChild(additionalInfo);
  }
  