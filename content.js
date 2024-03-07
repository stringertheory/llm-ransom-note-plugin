console.log("SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF SLDKFJ SLKDJF LSKJD FLKJS GLKSJ DGLKJS DLFKJ LDSKJFLSKJF ")

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request, sender, sendResponse)

  const sel = 'div[data-message-author-role="assistant"]'
  document.querySelectorAll(sel + ":not(.ransomy)").forEach(processNode);
  document.querySelectorAll(sel + ":not(.ransomy, :last-child)").forEach(el => el.classList.add('ransomy'));
  
});

// Helper function to wrap characters in span tags
function wrapCharacters(text) {
  return text.split('').map((char) => {
    const b = `b${Math.floor(Math.random() * 3)}`;
    const r = `r${Math.floor(Math.random() * 2)}`;
    const f = `f${Math.floor(Math.random() * 6)}`;
    const w = `w${Math.floor(Math.random() * 2)}`;
    const s = `s${Math.floor(Math.random() * 2)}`;
    const x = `x${Math.floor(Math.random() * 3)}`;
    const y = `y${Math.floor(Math.random() * 3)}`;
    let classes = "";
    if (char.trim()) {
      classes = `${b} ${r} ${f} ${w} ${s} ${x} ${y}`;
    }
    return `<span class="ransomy-container"><span class="ransomy ${classes}">${char}</span></span>`
  }).join('');
}

// Recursive function to process each node and its descendants
function processNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {

    // Create a document fragment to hold the new content
    const fragment = document.createDocumentFragment();
    const wrappedText = wrapCharacters(node.nodeValue);
    
    // Temporary div to hold the wrapped text HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = wrappedText;
    
    // Move the wrapped text spans from the tempDiv to the fragment
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    
    // Replace the original text node with the new fragment
    node.parentNode.replaceChild(fragment, node);
    
  } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("ransomy") && !node.classList.contains("text-xs")) {
    Array.from(node.childNodes).forEach(processNode);
  }
}


function makeObserver() {

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
	console.log('running', mutation)
	const sel = 'div[data-message-author-role="assistant"]:not(.ransomy)'
	document.querySelectorAll(sel).forEach(processNode);
      }
    }
  });
  // observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

// Example usage
const observer = makeObserver();
console.log('end');

// If you need to stop observing later
// observer.disconnect();



// function wrapTextInSpanWithObserver() {
//   // Helper function to wrap characters in span tags
//   function wrapCharacters(text) {
//     return text.split('').map(char => `<span class="letter">${char}</span>`).join('');
//   }

//   // Recursive function to process each node and its descendants
//   function processNode(node) {
//     if (node.nodeType === Node.TEXT_NODE) {
//       // Direct text node children of 'assistant' messages are wrapped
//       const wrappedText = wrapCharacters(node.nodeValue);
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = wrappedText;
//       while (tempDiv.firstChild) {
//         node.parentNode.insertBefore(tempDiv.firstChild, node);
//       }
//       node.parentNode.removeChild(node);
//     } else if (node.nodeType === Node.ELEMENT_NODE) {
//       // For element nodes, process all child nodes recursively
//       Array.from(node.childNodes).forEach(child => processNode(child));
//     }
//   }

//   // MutationObserver to observe and process new nodes
//   const observer = new MutationObserver((mutationsList) => {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'childList') {
//         mutation.addedNodes.forEach((node) => {
//           // Process new nodes if they are or are within
//           // 'assistant' message elements
// 	  console.log(node.nodeType, node.nodeName);
//           if (node.nodeType === Node.ELEMENT_NODE && (!(node.nodeName === "SPAN")) && node.matches('[data-message-author-role="assistant"], [data-message-author-role="assistant"] *')) {
// 	    console.log("YEAH", node);
//             processNode(node);
//           }
//         });
//       }
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });

//   // Initially process existing 'assistant' messages
//   document.querySelectorAll('[data-message-author-role="assistant"]').forEach(assistantMessage => {
//     processNode(assistantMessage);
//   });

//   return observer;
// }

// // Example usage
// const observer = wrapTextInSpanWithObserver();
// console.log('end');

// If you need to stop observing later
// observer.disconnect();


// function wrapTextInAssistantMessages() {

//   // Helper function to wrap characters in span tags
//   function wrapCharacters(text) {
//     return text.split('').map(char => `<span class="letter">${char}</span>`).join('');
//   }

//   // Function to process and wrap text nodes
//   function processNode(node) {
//     if (node.nodeType === Node.TEXT_NODE) {
//       const wrappedText = wrapCharacters(node.nodeValue);
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = wrappedText;
//       Array.from(tempDiv.childNodes).forEach((child) => {
//         node.parentNode.insertBefore(child, node);
//       });
//       node.parentNode.removeChild(node);
//     } else if (node.nodeType === Node.ELEMENT_NODE) {
//       console.log(node, node.closest('[data-message-author-role="assistant"]'))
//       // Check if the node is an assistant message or a descendant of one
//       if (node.getAttribute('data-message-author-role') === 'assistant') {
//         Array.from(node.childNodes).forEach(processNode);
//       } else if (node.closest('[data-message-author-role="assistant"]')) {
//         // This ensures all descendants of an assistant message are
//         // processed, not just the ones directly matching
//         Array.from(node.childNodes).forEach(processNode);
//       }
//     }
//   }

//   // MutationObserver callback to wrap text in specific divs
//   const observerCallback = (mutationsList, observer) => {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'childList') {
//         mutation.addedNodes.forEach((node) => {
//           // Check if the added node is an assistant message or
// 	  // contains assistant messages
//           if ((node.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-message-author-role') === 'assistant') ||
//               (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll('[data-message-author-role="assistant"]').length > 0)) {
// 	    console.log("YEAH", node);
//             processNode(node);
//           }
//         });
//       }
//     }
//   };

//   // Create a MutationObserver instance and configure it to observe
//   // childList changes and subtree modifications
//   const observer = new MutationObserver(observerCallback);
//   observer.observe(document.body, { childList: true, subtree: true });

//   // Initial processing of existing assistant messages
//   const existing = document.querySelectorAll('[data-message-author-role="assistant"]');
//   console.log('existing', existing);
//   existing.forEach(processNode);

//   return observer; // in case you want to stop observing later
// }

// // To set up the observer when the extension is loaded:
// wrapTextInAssistantMessages();

// // Example of stopping the observer, if needed:
// // observer.disconnect();

// function wrapTextInSpanWithObserver(targetElement) {
//   // Helper function to wrap characters in span tags
//   function wrapCharacters(text) {
//     return text.split('').map(char => `<span class="letter">${char}</span>`).join('');
//   }

//   // Function to process and wrap text nodes
//   function processNode(node) {
//     console.log("node", node);
//     if (node.nodeType === Node.TEXT_NODE) {
//       const wrappedText = wrapCharacters(node.nodeValue);
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = wrappedText;
//       Array.from(tempDiv.childNodes).forEach((child) => {
//         node.parentNode.insertBefore(child, node);
//       });
//       node.parentNode.removeChild(node);
//     } else if (node.nodeType === Node.ELEMENT_NODE) {
//       Array.from(node.childNodes).forEach(processNode);
//     }
//   }

//   // MutationObserver callback to wrap text of added nodes
//   const observerCallback = (mutationsList, observer) => {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'childList') {
//         mutation.addedNodes.forEach((node) => {
//           // Process added nodes that are text or have child nodes
//           if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length > 0)) {
//             processNode(node);
//           }
//         });
//       }
//     }
//   };

//   // Create a MutationObserver instance and configure it to observe childList changes
//   // const observer = new MutationObserver(observerCallback);
//   // observer.observe(targetElement, { childList: true, subtree: true });

//   // Initial processing of the target element to wrap existing text
//   // processNode(targetElement);

//   [...document.querySelectorAll('div[data-message-author-role="assistant"]')].forEach(e => processNode(e))

//   return 0;
//   // return observer; // in case you want to stop observing later
// }

// var insertedNodes = [];
// var mainObserver = new MutationObserver(function(mutations) {
//   mutations.forEach(function(mutation) {
//     mutation.addedNodes.forEach((node) => {
//       console.log(node);
//       if (node.querySelector) {
// 	console.log("ATTR", node.querySelector('div[data-message-author-role="assitant"]'));
//       }
//     })
//   })
// });
// [...document.getElementsByTagName("main")].forEach(element => {
//   mainObserver.observe(element, { childList: true, subtree: true });
// })

// // Usage example:
// // Assume there's an element with the ID 'example' you want to observe.
// // const elementToObserve = document.getElementById('example');
// // const observer = wrapTextInSpanWithObserver(elementToObserve);

// console.log([...document.querySelectorAll('div[data-message-author-role="assistant"]')])
// // [...document.getElementsByTagName("main")].forEach(element => {
// //   console.log(element);
// //   const observer = wrapTextInSpanWithObserver(element);
// //   console.log(observer);
// //   // observer.observe(element, { childList: true, subtree: true });
// // })

// // To stop observing changes when no longer needed:
// // observer.disconnect();
