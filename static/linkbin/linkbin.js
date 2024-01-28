// Assume data.json has an array of objects like: [{name: 'Object 1'}, {name: 'Object 2'}, ...]
const fetchData = async () => {
    const response = await fetch('links.json');
    const data = await response.json();
    return data;
};

const displayResults = (results) => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = 'No results found :(';
    } else {
        results.forEach((result) => {
            // Container for each result
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-box';

            // The link
            const link = document.createElement('h3');
            link.className = 'result-link';
            link.innerHTML = '[<a href=' + result.link + ' target="_blank" rel="noopener noreferrer">link</a>]';
            resultDiv.append(link);

            // The title
            const resultTitle = document.createElement('h3');
            resultTitle.className = 'result-title';
            resultTitle.textContent = result.title;
            resultDiv.append(resultTitle);

            // The description
            const resultDescription = document.createElement('p');
            resultDescription.className = 'result-description';
            resultDescription.textContent = result.description;
            resultDiv.append(resultDescription);

            // The tags
            const tags = document.createElement("p");
            tags.className = 'result-tags';
            tags.innerHTML = 'tags: <a style="font-family: \'Courier New\', Courier, monospace;">' + result.tags.join(', ') + '</a>';
            resultDiv.append(tags);

            // Add this result to the main results container
            resultsContainer.appendChild(resultDiv);
        });
    }
};


// Weird sort function :sob:
function compareNicheness(a, b) {
    const sortBy = document.getElementById('sort').value;

    if(a.nicheness > b.nicheness) {
        if (sortBy == 'asc-nicheness') {
            return 1;
        } else {
            return -1;
        }
    } else if (a.nicheness < b.nicheness) {
        if (sortBy == 'asc-nicheness') {
            return -1;
        } else {
            return 1;
        }
    }

    return 0;
}

const search = async () => {
    // Get the data
    const data = await fetchData();

    // Get the search query
    const query = document.getElementById('searchInput').value.toLowerCase();

    // Get the tags
    const tags = document.getElementById('tagsInput').value.toLowerCase().split(' ');

    // Filter by tags if they were specified
    var tagged = data;
    tags.forEach((tag) => {
        if(tag.length != 0) {
            tagged = tagged.filter((item) => item.tags.includes(tag));
        }
    });

    // Filter by search query
    var filtered = tagged.filter((item) => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
    
    // Sort if needed
    if (document.getElementById('sort').value != 'none') {
        filtered.sort(compareNicheness);
    }
    
    // Display the results
    displayResults(filtered);
};


// Fetch data and display all results initially
fetchData().then((data) => displayResults(data));

 
// jQuery code called after web page loads
$(function() {

    // Execute a search any time an input field changes
    $('input').on('input', function() {
        search();
    });

    // Also execute a search any time the sort by parameter changes
    $('select').on('input', function() {
        search();
    });

});
