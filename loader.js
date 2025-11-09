document.addEventListener("DOMContentLoaded", () => {
    // Look for the placeholder element
    const headerPlaceholder = document.getElementById("universal-header-placeholder");

    // If the placeholder exists, fetch the header component
    if (headerPlaceholder) {
        fetch("header.html")
            .then(response => {
                // Check if the file was found
                if (!response.ok) {
                    throw new Error("Network response was not ok " + response.statusText);
                }
                return response.text();
            })
            .then(data => {
                // Inject the fetched HTML into the placeholder
                headerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error("Error loading the header:", error);
                // Display an error message inside the placeholder if it fails
                headerPlaceholder.textContent = "Error: Could not load header.";
            });
    }
});
