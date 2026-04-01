const docusign = require('docusign-esign');
console.log('DocuSign Keys:', Object.keys(docusign).filter(k => k.charAt(0) === k.charAt(0).toUpperCase()));
