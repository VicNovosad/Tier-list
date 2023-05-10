function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.dataTransfer.setData("class", ev.target.className);
}

function drop(ev) {
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
    updateURLAndLocalStorage();
}

var tiers = document.getElementsByClassName('tier');
Array.from(tiers).forEach(tier => {
    tier.draggable = true;
    tier.addEventListener("dragstart", drag);
});

function updateURLAndLocalStorage() {
    var tiers = document.getElementsByClassName('tier');
    var searchParams = new URLSearchParams();
    Array.from(tiers).forEach(tier => {
        var items = Array.from(tier.children).map(x => x.id).join(',');
        searchParams.set(tier.id, items);
        localStorage.setItem(tier.id, items);
    });
    window.history.replaceState(null, null, "?" + searchParams.toString());
}

function loadFromLocalStorage() {
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
}

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

function toCamelCase(str) {
    return str.replace(/\s+/g, ' ').split(' ')
              .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
}

window.addEventListener('load', function() {
    var cardsData;
    $.ajax({
        url: '/cards-data.json',
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
        var cards = cardsData[0]["Diamond Character card"];
        var cardContainer = document.querySelector('.cards-pond');
        for (var cardName in cards) {
            var cardImgPath = cards[cardName];

            var cardDiv = document.createElement('div');
            cardDiv.id = toCamelCase(cardName);
            cardDiv.className = 'dragDiv';
            cardDiv.draggable = true;
            cardDiv.addEventListener('dragstart', drag);

            var cardImg = document.createElement('img');
            cardImg.src = cardImgPath;

            cardDiv.appendChild(cardImg);
            cardContainer.appendChild(cardDiv);
        }
        loadFromLocalStorage();
    }

    document.getElementById('resetButton').addEventListener('click', function() {
        localStorage.clear();
        // Reload the page
        location.reload();
    });
});


