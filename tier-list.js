class DragDrop {
    constructor() {}

    allowDrop(ev) {
        ev.preventDefault();
    }

    drag(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
        ev.dataTransfer.setData("class", ev.target.className);
    }

    drop(ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("text");
        var classData = ev.dataTransfer.getData("class");
        var draggedItem = document.getElementById(data);
        if (classData.includes("dragDiv")) {
            if (ev.target.classList.contains("dragDiv")) {
                if (ev.offsetX > ev.target.offsetWidth / 2) {
                    if (ev.target.nextSibling) {
                        ev.target.parentNode.insertBefore(draggedItem, ev.target.nextSibling);
                    } else {
                        ev.target.parentNode.appendChild(draggedItem);
                    }
                } else {
                    ev.target.parentNode.insertBefore(draggedItem, ev.target);
                }
            } else if (ev.target.classList.contains("tier")) {
                ev.target.appendChild(draggedItem);
            }
        } else if (classData.includes("tier")) {
            if (ev.target.classList.contains("tier")) {
                // Swap positions of the dragged and target tiers
                ev.target.parentNode.insertBefore(draggedItem, ev.target);
                if (draggedItem.nextSibling) {
                    ev.target.parentNode.insertBefore(ev.target, draggedItem.nextSibling);
                } else {
                    ev.target.parentNode.appendChild(ev.target);
                }
            }
        }
        localStorageHandler.updateURLAndLocalStorage();
    }

    toCamelCase(str) {
        return str.replace(/\s+/g, ' ').split(' ')
                  .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join('');
    }

    loadData(cardRanking) {
        var cardsData;
        
        $.ajax({
            url: '/character-cards-data.json',
            dataType: 'json',
            async: false,
            success: function(data) {
                cardsData = data;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error:', errorThrown);
            }
        });
    
        if (cardsData) {
            var cards = cardsData[0][cardRanking];
            var cardContainer = document.querySelector('.cards-pond');
            for (const cardName in cards) {
                const cardImgPath = cards[cardName];
    
                const cardDiv = document.createElement('div');
                cardDiv.id = this.toCamelCase(cardName);
                cardDiv.className = 'dragDiv';
                cardDiv.draggable = true;
                cardDiv.addEventListener('dragstart', this.drag);
    
                const cardImg = document.createElement('img');
                cardImg.src = cardImgPath;
                
                let cardTitle = document.createElement('h5');
                cardTitle.innerText = cardName;
    
                // console.log(cardTitle)
    
                cardDiv.appendChild(cardImg);
                cardDiv.appendChild(cardTitle);
                cardContainer.appendChild(cardDiv);
            }
            localStorageHandler.loadFromLocalStorage();
        }
    }

    clearAndLoad(cardRanking) {
        $('.cards-pond').empty();
        $('.tier-list-container .tier').empty();
        this.loadData(cardRanking);
    }
}

class LocalStorageHandler {
    constructor() {
        // Initialize urlParams when the object is created
        this.urlParams = new URLSearchParams(window.location.search);
    }

    updateURLAndLocalStorage() {
        var tiers = document.getElementsByClassName('tier');
        var searchParams = new URLSearchParams();
        var activeTab = $('.tab.active').text();
        searchParams.set('activeTab', activeTab);
        Array.from(tiers).forEach(tier => {
            var items = Array.from(tier.children).map(x => x.id).join(',');
            searchParams.set(tier.id, items);
            localStorage.setItem(tier.id, items);
        });
        localStorage.setItem('activeTab', activeTab);
        window.history.replaceState(null, null, "?" + searchParams.toString());
    }
    
    loadFromLocalStorage() {
        var tiers = document.getElementsByClassName('tier');
        Array.from(tiers).forEach(tier => {
            var items = (localStorage.getItem(tier.id) || '').split(',');
            items.forEach(id => {
                var item = document.getElementById(id);
                if (item) { 
                    tier.appendChild(item);
                }
            });
        });
        let activeTab = localStorage.getItem('activeTab');
        if(activeTab) {
            $('.tab-container .tab').removeClass('active');
            $(`.tab-container .tab:contains(${activeTab})`).addClass('active');
        }
    }

    clearLocalStorage() {
        localStorage.clear();
    }

    clearURL(activeTab) {
        // Set the 'tab' parameter to the name of the active tab
        this.urlParams.set('tab', activeTab);
        // Replace the current history state with a state that includes the 'tab' parameter
        window.history.replaceState({}, document.title, window.location.pathname + '?' + this.urlParams.toString());
    }
}
class UIHandler {
    constructor(dragDrop, localStorageHandler) {
        this.dragDrop = dragDrop;
        this.localStorageHandler = localStorageHandler;
        this.init();
    }

    init() {
        window.addEventListener('load', () => {
            // Check if URL has parameters
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.toString()) {
                // Clear local storage
                this.localStorageHandler.clearLocalStorage();
    
                // Update local storage with URL parameters
                for (const [key, value] of urlParams.entries()) {
                    localStorage.setItem(key, value);
                }
            }
    
            this.localStorageHandler.loadFromLocalStorage();
    
            let activeTab = $('.tab.active').text();
            this.dragDrop.loadData(`${activeTab} Character cards`);
            
            this.setupCopyURL();
            this.setupResetButton();
            this.setupTabClick();
    
            // Add event listeners to tiers
            this.setupTierEvents();
        });
    }
    

    setupTierEvents() {
        const tiers = document.getElementsByClassName('tier');
        Array.from(tiers).forEach(tier => {
            tier.addEventListener('drop', (event) => this.dragDrop.drop(event));
            tier.addEventListener('dragover', (event) => this.dragDrop.allowDrop(event));
        });
    }

    setupCopyURL() {
        document.getElementById('copyButton').addEventListener('click', function() {
            var url = new URL(window.location.href);
            var searchParams = new URLSearchParams();
            var tiers = document.getElementsByClassName('tier');
            Array.from(tiers).forEach(tier => {
                searchParams.set(tier.id, localStorage.getItem(tier.id));
            });
            url.search = searchParams.toString();
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url.href);
            } else {
                var textarea = document.createElement('textarea');
                textarea.textContent = url.href;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                } catch (ex) {
                    console.error('Failed to copy URL', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        });
    }

    setupResetButton() {
        document.getElementById('resetButton').addEventListener('click', () => {
            this.localStorageHandler.clearLocalStorage();
            $('.cards-pond').empty();
            $('.tier-list-container .tier').empty();
            $('.tab.active').trigger('click');
        });
    }

    setupTabClick() {
        $('.tab-container .tab').click((event) => {
            $('.tab-container .tab').removeClass('active');
            $(event.target).addClass('active');
            
            switch($(event.target).text()) {
                case "Bronze":
                    this.dragDrop.clearAndLoad("Bronze Character cards");
                    break;
                case "Silver":
                    this.dragDrop.clearAndLoad("Silver Character cards");
                    break;
                default:
                    this.dragDrop.clearAndLoad("Bronze Character cards");
            }
        });
    }
}

// Initialize the drag and drop functionality, local storage, and UI handler.
const dragDrop = new DragDrop();
const localStorageHandler = new LocalStorageHandler();
const uiHandler = new UIHandler(dragDrop, localStorageHandler);


