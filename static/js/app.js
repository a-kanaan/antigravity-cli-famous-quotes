(function () {
  "use strict";

  const state = {
    author: "",
    category: "",
    currentSpotlightQuote: null,
    filteredQuotes: [],
    totalQuotes: 100,
    theme: "light",
  };

  // DOM Elements
  const totalQuotesBadge = document.getElementById("total-quotes-badge");
  const totalAuthorsBadge = document.getElementById("total-authors-badge");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeToggleIcon = document.getElementById("theme-toggle-icon");
  const themeToggleLabel = document.getElementById("theme-toggle-label");
  const randomScopeBadge = document.getElementById("random-scope-badge");
  const spotlightBody = document.getElementById("spotlight-body");
  const spotlightQuoteText = document.getElementById("spotlight-quote-text");
  const spotlightQuoteAuthor = document.getElementById("spotlight-quote-author");
  const spotlightQuoteCategories = document.getElementById("spotlight-quote-categories");
  const newRandomBtn = document.getElementById("new-random-btn");
  const copyQuoteBtn = document.getElementById("copy-quote-btn");

  const authorSearchInput = document.getElementById("author-search-input");
  const authorSuggestions = document.getElementById("author-suggestions");
  const categorySelect = document.getElementById("category-select");
  const categoryPills = document.getElementById("category-pills");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");

  const resultsCount = document.getElementById("results-count");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const quotesGrid = document.getElementById("quotes-grid");
  const emptyState = document.getElementById("empty-state");
  const emptyResetBtn = document.getElementById("empty-reset-btn");

  function debounce(fn, delayMs) {
    let timerId = null;
    return function (...args) {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        fn.apply(this, args);
      }, delayMs);
    };
  }

  function updateScopeBadge() {
    const parts = [];
    if (state.author) {
      parts.push(`Author: "${state.author}"`);
    }
    if (state.category) {
      parts.push(`Category: ${state.category}`);
    }
    if (parts.length === 0) {
      randomScopeBadge.textContent = `Drawing from: All ${state.totalQuotes} Quotes`;
    } else {
      randomScopeBadge.textContent = `Drawing from: ${parts.join(" + ")}`;
    }
    clearFiltersBtn.hidden = parts.length === 0;
  }

  function renderSpotlightQuote(quote) {
    state.currentSpotlightQuote = quote;
    spotlightBody.classList.add("fade");

    setTimeout(() => {
      if (!quote) {
        spotlightQuoteText.textContent =
          "No quotes match the active filter criteria. Reset filters to draw a random quote.";
        spotlightQuoteAuthor.textContent = "";
        spotlightQuoteCategories.innerHTML = "";
        spotlightBody.classList.remove("fade");
        return;
      }

      spotlightQuoteText.textContent = `\u201C${quote.text}\u201D`;
      spotlightQuoteAuthor.textContent = `\u2014 ${quote.author}`;
      spotlightQuoteAuthor.dataset.author = quote.author;

      spotlightQuoteCategories.innerHTML = "";
      quote.categories.forEach((cat) => {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "tag-badge tag-badge-dark";
        badge.textContent = cat;
        badge.title = `Filter by category: ${cat}`;
        badge.addEventListener("click", () => {
          setCategoryFilter(cat);
        });
        spotlightQuoteCategories.appendChild(badge);
      });

      spotlightBody.classList.remove("fade");
    }, 120);
  }

  async function fetchRandomQuote() {
    const params = new URLSearchParams();
    if (state.author) {
      params.set("author", state.author);
    }
    if (state.category) {
      params.set("category", state.category);
    }
    if (state.currentSpotlightQuote && state.currentSpotlightQuote.id) {
      params.set("exclude_id", String(state.currentSpotlightQuote.id));
    }

    try {
      const response = await fetch(`/api/quotes/random?${params.toString()}`);
      if (!response.ok) {
        renderSpotlightQuote(null);
        return;
      }
      const quote = await response.json();
      renderSpotlightQuote(quote);
    } catch (err) {
      console.error("Failed to fetch random quote:", err);
    }
  }

  async function copyQuoteToClipboard(quote, buttonEl, defaultLabel) {
    if (!quote || !buttonEl) {
      return;
    }
    const textToCopy = `"${quote.text}" — ${quote.author}`;
    let copied = false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    if (copied) {
      if (buttonEl._copyTimerId) {
        clearTimeout(buttonEl._copyTimerId);
      }
      buttonEl.textContent = "Copied!";
      buttonEl.classList.add("copied");
      buttonEl._copyTimerId = setTimeout(() => {
        buttonEl.textContent = defaultLabel;
        buttonEl.classList.remove("copied");
        buttonEl._copyTimerId = null;
      }, 1500);
    }
  }

  function escapeCsvField(value) {
    const str = String(value ?? "");
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportQuotesToCsv() {
    if (!state.filteredQuotes || state.filteredQuotes.length === 0) {
      return;
    }

    const headers = ["id", "text", "author", "categories"];
    const rows = state.filteredQuotes.map((q) => [
      escapeCsvField(q.id),
      escapeCsvField(q.text),
      escapeCsvField(q.author),
      escapeCsvField((q.categories || []).join("; ")),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "famous-quotes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function createQuoteCard(quote) {
    const card = document.createElement("article");
    card.className = "quote-card";

    const blockquote = document.createElement("blockquote");
    blockquote.className = "quote-card-text";
    blockquote.textContent = `\u201C${quote.text}\u201D`;

    const footer = document.createElement("div");
    footer.className = "quote-card-footer";

    const footerTop = document.createElement("div");
    footerTop.className = "quote-card-footer-top";

    const authorBtn = document.createElement("button");
    authorBtn.type = "button";
    authorBtn.className = "quote-card-author";
    authorBtn.textContent = `\u2014 ${quote.author}`;
    authorBtn.title = `Search quotes by ${quote.author}`;
    authorBtn.addEventListener("click", () => {
      setAuthorFilter(quote.author);
    });

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "quote-card-copy-btn";
    copyBtn.textContent = "Copy to Clipboard";
    copyBtn.title = "Copy quote to clipboard";
    copyBtn.addEventListener("click", () => {
      copyQuoteToClipboard(quote, copyBtn, "Copy to Clipboard");
    });

    footerTop.appendChild(authorBtn);
    footerTop.appendChild(copyBtn);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "quote-card-tags";

    quote.categories.forEach((cat) => {
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "tag-badge";
      tag.textContent = cat;
      tag.title = `Filter by category: ${cat}`;
      tag.addEventListener("click", () => {
        setCategoryFilter(cat);
      });
      tagsContainer.appendChild(tag);
    });

    footer.appendChild(footerTop);
    footer.appendChild(tagsContainer);

    card.appendChild(blockquote);
    card.appendChild(footer);
    return card;
  }

  function renderQuotesList(quotes) {
    state.filteredQuotes = quotes;
    quotesGrid.innerHTML = "";
    const count = quotes.length;
    if (exportCsvBtn) {
      exportCsvBtn.disabled = count === 0;
    }

    const filterSuffix = [];
    if (state.author) {
      filterSuffix.push(`author matching "${state.author}"`);
    }
    if (state.category) {
      filterSuffix.push(`category "${state.category}"`);
    }

    const suffixText =
      filterSuffix.length > 0 ? ` for ${filterSuffix.join(" and ")}` : "";
    resultsCount.textContent = `Showing ${count} ${
      count === 1 ? "quote" : "quotes"
    }${suffixText}`;

    if (count === 0) {
      emptyState.hidden = false;
      quotesGrid.hidden = true;
      return;
    }

    emptyState.hidden = true;
    quotesGrid.hidden = false;

    const fragment = document.createDocumentFragment();
    quotes.forEach((quote) => {
      fragment.appendChild(createQuoteCard(quote));
    });
    quotesGrid.appendChild(fragment);
  }

  async function fetchQuotesAndSyncSpotlight() {
    updateScopeBadge();

    const params = new URLSearchParams();
    if (state.author) {
      params.set("author", state.author);
    }
    if (state.category) {
      params.set("category", state.category);
    }

    try {
      const response = await fetch(`/api/quotes?${params.toString()}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      renderQuotesList(data.quotes);

      // Update spotlight quote if no quote is loaded yet or if current spotlight doesn't match active filters
      if (data.quotes.length === 0) {
        renderSpotlightQuote(null);
      } else {
        const currentMatches =
          state.currentSpotlightQuote &&
          data.quotes.some((q) => q.id === state.currentSpotlightQuote.id);
        if (!currentMatches) {
          const randomIndex = Math.floor(Math.random() * data.quotes.length);
          renderSpotlightQuote(data.quotes[randomIndex]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
    }
  }

  function syncCategoryControls() {
    categorySelect.value = state.category;
    const buttons = categoryPills.querySelectorAll(".pill");
    buttons.forEach((btn) => {
      const pillCat = btn.dataset.category || "";
      btn.classList.toggle(
        "active",
        pillCat.toLowerCase() === state.category.toLowerCase()
      );
    });
  }

  function setCategoryFilter(category) {
    state.category = category;
    syncCategoryControls();
    fetchQuotesAndSyncSpotlight();
  }

  function setAuthorFilter(author) {
    state.author = author;
    authorSearchInput.value = author;
    fetchQuotesAndSyncSpotlight();
  }

  function resetAllFilters() {
    state.author = "";
    state.category = "";
    authorSearchInput.value = "";
    syncCategoryControls();
    fetchQuotesAndSyncSpotlight();
  }

  async function initMetadata() {
    try {
      const response = await fetch("/api/metadata");
      if (!response.ok) {
        return;
      }
      const meta = await response.json();
      state.totalQuotes = meta.total_quotes || 100;
      totalQuotesBadge.textContent = String(state.totalQuotes);
      totalAuthorsBadge.textContent = String(meta.authors.length);

      // Populate author datalist
      authorSuggestions.innerHTML = "";
      meta.authors.forEach((authorObj) => {
        const option = document.createElement("option");
        option.value = authorObj.name;
        option.label = `${authorObj.name} (${authorObj.count})`;
        authorSuggestions.appendChild(option);
      });

      // Populate category dropdown and pills
      categorySelect.innerHTML = '<option value="">All Categories</option>';
      categoryPills.innerHTML = "";

      const allPill = document.createElement("button");
      allPill.type = "button";
      allPill.className = "pill active";
      allPill.dataset.category = "";
      allPill.textContent = `All (${state.totalQuotes})`;
      allPill.addEventListener("click", () => setCategoryFilter(""));
      categoryPills.appendChild(allPill);

      meta.categories.forEach((catObj) => {
        const opt = document.createElement("option");
        opt.value = catObj.name;
        opt.textContent = `${catObj.name} (${catObj.count})`;
        categorySelect.appendChild(opt);

        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "pill";
        pill.dataset.category = catObj.name;
        pill.textContent = `${catObj.name} (${catObj.count})`;
        pill.addEventListener("click", () => setCategoryFilter(catObj.name));
        categoryPills.appendChild(pill);
      });
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  }

  function applyTheme(theme) {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    state.theme = resolvedTheme;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    try {
      localStorage.setItem("famous_quotes_theme", resolvedTheme);
    } catch (err) {
      // Ignore storage access errors in private browsing modes
    }
    if (themeToggleBtn) {
      const isDark = resolvedTheme === "dark";
      themeToggleBtn.setAttribute("aria-pressed", String(isDark));
      if (themeToggleIcon) {
        themeToggleIcon.textContent = isDark ? "\u2600" : "\u263E";
      }
      if (themeToggleLabel) {
        themeToggleLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
      }
    }
  }

  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem("famous_quotes_theme");
    } catch (err) {
      // Ignore storage errors
    }
    if (savedTheme === "dark" || savedTheme === "light") {
      applyTheme(savedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }

  // Event Listeners
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      applyTheme(state.theme === "dark" ? "light" : "dark");
    });
  }

  newRandomBtn.addEventListener("click", () => {
    fetchRandomQuote();
  });

  copyQuoteBtn.addEventListener("click", () => {
    copyQuoteToClipboard(state.currentSpotlightQuote, copyQuoteBtn, "Copy Quote");
  });

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportQuotesToCsv);
  }

  spotlightQuoteAuthor.addEventListener("click", () => {
    const author = spotlightQuoteAuthor.dataset.author;
    if (author) {
      setAuthorFilter(author);
    }
  });

  const handleAuthorInput = debounce(() => {
    state.author = authorSearchInput.value.trim();
    fetchQuotesAndSyncSpotlight();
  }, 200);

  authorSearchInput.addEventListener("input", handleAuthorInput);

  categorySelect.addEventListener("change", () => {
    setCategoryFilter(categorySelect.value);
  });

  clearFiltersBtn.addEventListener("click", resetAllFilters);
  emptyResetBtn.addEventListener("click", resetAllFilters);

  // Initial Load
  (async function bootstrap() {
    initTheme();
    await initMetadata();
    await fetchRandomQuote();
    await fetchQuotesAndSyncSpotlight();
  })();
})();
