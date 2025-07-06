// Test script to manually add delete buttons
function addDeleteButtons() {
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        const dateElement = item.querySelector('.history-date');
        if (dateElement && !dateElement.parentElement.classList.contains('history-header')) {
            // Extract date from the text
            const dateText = dateElement.textContent;
            
            // Create header wrapper
            const header = document.createElement('div');
            header.className = 'history-header';
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete this reflection';
            deleteBtn.onclick = () => {
                console.log('Delete clicked for:', dateText);
                // For now, just log - we'll implement actual deletion later
            };
            
            // Move date element to header and add delete button
            dateElement.parentElement.insertBefore(header, dateElement);
            header.appendChild(dateElement);
            header.appendChild(deleteBtn);
        }
    });
}

// Run the function
addDeleteButtons();
