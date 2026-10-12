document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const langToggle = document.getElementById("langToggle");
    const searchInput = document.getElementById("searchInput");
    const downloadsGrid = document.getElementById("downloadsGrid");
    const videosGrid = document.getElementById("videosGrid");
    const year = document.getElementById("year");

    let currentLang = localStorage.getItem("lang") || "ar";
    let currentTheme = localStorage.getItem("theme") || "dark";

    const observer = "IntersectionObserver" in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 })
        : null;

    function observeElements(container = document) {
        container.querySelectorAll(".animate-on-scroll:not(.show)").forEach(element => {
            if (observer) {
                observer.observe(element);
            } else {
                element.classList.add("show");
            }
        });
    }

    function applyTheme() {
        const isDark = currentTheme === "dark";

        root.classList.toggle("dark", isDark);
        themeIcon.className = isDark
            ? "fa-solid fa-sun text-xl"
            : "fa-solid fa-moon text-xl";

        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        localStorage.setItem("theme", currentTheme);
    }

    function applyLanguage() {
        const language = translations[currentLang];

        root.lang = currentLang;
        root.dir = currentLang === "ar" ? "rtl" : "ltr";

        document.body.classList.toggle("font-cairo", currentLang === "ar");
        document.body.classList.toggle("font-poppins", currentLang === "en");

        langToggle.textContent = currentLang === "ar" ? "EN" : "AR";

        document.querySelectorAll("[data-i18n]").forEach(element => {
            const key = element.dataset.i18n;

            if (language[key]) {
                element.innerHTML = language[key];
            }
        });

        searchInput.placeholder = language.searchPlaceholder;

        localStorage.setItem("lang", currentLang);

        renderDownloads();
        renderVideos();
    }

    function renderDownloads() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const language = translations[currentLang];

        const filtered = appData.downloads.filter(item => {
            const arabicName = (item.nameAr || "").toLocaleLowerCase();
            const englishName = (item.nameEn || "").toLocaleLowerCase();

            return arabicName.includes(query) || englishName.includes(query);
        });

        downloadsGrid.replaceChildren();

        if (!filtered.length) {
            const message = document.createElement("p");
            message.className = "empty-message";
            message.textContent = language.searchEmpty;
            downloadsGrid.appendChild(message);
            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach(item => {
            const card = document.createElement("div");
            card.className = "download-card card-hover animate-on-scroll bg-white dark:bg-darkCard p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800";

            const title = document.createElement("div");
            title.className = "font-bold text-lg flex items-center gap-3";

            const icon = document.createElement("i");
            icon.className = "fa-solid fa-folder text-primary text-xl";

            const name = document.createElement("span");
            name.textContent = currentLang === "ar" ? item.nameAr : item.nameEn;

            title.append(icon, name);

            const link = document.createElement("a");
            link.href = item.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition";

            const linkText = document.createElement("span");
            linkText.textContent = language.downloadBtn;

            const downloadIcon = document.createElement("i");
            downloadIcon.className = "fa-solid fa-download ms-2";

            link.append(linkText, downloadIcon);
            card.append(title, link);
            fragment.appendChild(card);
        });

        downloadsGrid.appendChild(fragment);
        observeElements(downloadsGrid);
    }

    async function renderVideos() {
        videosGrid.replaceChildren();

        const language = translations[currentLang];

        if (!appData.youtubeApiKey || appData.youtubeApiKey === "YOUR_YOUTUBE_API_KEY") {
            showVideoMessage(language.videosError);
            return;
        }

        if (!appData.videoIds.length) {
            showVideoMessage(language.noVideos);
            return;
        }

        showVideoMessage(language.loadingVideos);

        try {
            const params = new URLSearchParams({
                part: "snippet,statistics",
                id: appData.videoIds.join(","),
                key: appData.youtubeApiKey
            });

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?${params}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.items || !data.items.length) {
                showVideoMessage(language.noVideos);
                return;
            }

            const fragment = document.createDocumentFragment();

            data.items.forEach(video => {
                const snippet = video.snippet;
                const statistics = video.statistics || {};
                const thumbnail = snippet.thumbnails.maxres
                    || snippet.thumbnails.high
                    || snippet.thumbnails.medium
                    || snippet.thumbnails.default;

                const card = document.createElement("article");
                card.className = "video-card card-hover animate-on-scroll bg-gray-100 dark:bg-darkCard rounded-2xl overflow-hidden shadow-md";

                const link = document.createElement("a");
                link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = "block group";

                const image = document.createElement("img");
                image.src = thumbnail.url;
                image.alt = snippet.title;
                image.loading = "lazy";
                image.width = thumbnail.width || 480;
                image.height = thumbnail.height || 360;
                image.className = "w-full group-hover:opacity-90 transition";

                const content = document.createElement("div");
                content.className = "p-4";

                const title = document.createElement("h3");
                title.className = "font-bold text-sm md:text-base mb-3 leading-7";
                title.textContent = snippet.title;

                const views = document.createElement("p");
                views.className = "text-gray-500 text-sm";

                const eye = document.createElement("i");
                eye.className = "fa-solid fa-eye me-1";

                const viewCount = Number(statistics.viewCount || 0).toLocaleString(
                    currentLang === "ar" ? "ar-EG" : "en-US"
                );

                views.append(eye, document.createTextNode(
                    `${viewCount} ${language.viewsText}`
                ));

                content.append(title, views);
                link.append(image, content);
                card.appendChild(link);
                fragment.appendChild(card);
            });

            videosGrid.replaceChildren(fragment);
            observeElements(videosGrid);
        } catch (error) {
            console.error("Failed to load YouTube videos:", error);
            showVideoMessage(language.videosError);
        }
    }

    function showVideoMessage(message) {
        const element = document.createElement("p");
        element.className = "empty-message col-span-full";
        element.textContent = message;
        videosGrid.replaceChildren(element);
    }

    themeToggle.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme();
    });

    langToggle.addEventListener("click", () => {
        currentLang = currentLang === "ar" ? "en" : "ar";
        applyLanguage();
    });

    searchInput.addEventListener("input", renderDownloads);

    year.textContent = new Date().getFullYear();

    applyTheme();
    applyLanguage();
    observeElements();
});