/**
 * Debug Validation Errors Script
 * Run this in browser console on the film edit page to see what validation errors are occurring
 */

window.debugValidation = {
  // Check form data and validation
  checkFormValidation: function() {
    console.log('🔍 DEBUGGING FORM VALIDATION');
    console.log('================================');
    
    // Try to find the form data from React component
    const formElement = document.querySelector('form');
    if (!formElement) {
      console.error('❌ No form element found');
      return;
    }
    
    // Check all required fields
    const requiredFields = [
      { name: 'titleEn', selector: 'input[placeholder*="English title"]' },
      { name: 'category', selector: 'select' },
      { name: 'genres', selector: '[data-testid="genre-selector"], .genre-selector' },
      { name: 'countries', selector: '[data-testid="country-selector"], .country-selector' },
      { name: 'languages', selector: '[data-testid="language-selector"], .language-selector' },
      { name: 'logline', selector: 'input[placeholder*="logline"], input[placeholder*="Logline"]' },
      { name: 'synopsis', selector: 'textarea[placeholder*="synopsis"], textarea[placeholder*="Synopsis"]' },
      { name: 'timeEstimate', selector: 'select[value]' },
      { name: 'theatre', selector: 'select' },
      { name: 'director', selector: 'input[placeholder*="director"], input[placeholder*="Director"]' },
      { name: 'status', selector: 'select' }
    ];
    
    console.log('📋 Checking required fields:');
    console.log('----------------------------');
    
    let hasErrors = false;
    
    requiredFields.forEach(field => {
      const elements = document.querySelectorAll(field.selector);
      let fieldValue = null;
      let fieldFound = false;
      
      elements.forEach(el => {
        if (el.value !== undefined) {
          fieldValue = el.value;
          fieldFound = true;
        }
      });
      
      const isEmpty = !fieldValue || fieldValue.trim() === '';
      const status = isEmpty ? '❌ EMPTY' : '✅ OK';
      
      console.log(`${field.name}: ${status} (value: "${fieldValue}")`);
      
      if (isEmpty) {
        hasErrors = true;
      }
    });
    
    console.log('----------------------------');
    console.log(`Overall validation: ${hasErrors ? '❌ HAS ERRORS' : '✅ ALL GOOD'}`);
    
    return { hasErrors, requiredFields };
  },
  
  // Check for error messages in the DOM
  checkErrorMessages: function() {
    console.log('\n🚨 CHECKING ERROR MESSAGES');
    console.log('===========================');
    
    const errorElements = document.querySelectorAll('.text-red-400, .text-red-500, [class*="error"]');
    
    if (errorElements.length === 0) {
      console.log('✅ No error messages found in DOM');
      return [];
    }
    
    const errors = [];
    errorElements.forEach((el, index) => {
      const text = el.textContent.trim();
      if (text) {
        console.log(`Error ${index + 1}: "${text}"`);
        errors.push(text);
      }
    });
    
    return errors;
  },
  
  // Check form inputs and their values
  checkFormInputs: function() {
    console.log('\n📝 CHECKING FORM INPUTS');
    console.log('========================');
    
    const inputs = document.querySelectorAll('input, select, textarea');
    const formData = {};
    
    inputs.forEach((input, index) => {
      const name = input.name || input.placeholder || `input_${index}`;
      const value = input.value;
      const type = input.type || input.tagName.toLowerCase();
      
      formData[name] = { value, type };
      
      if (input.required || input.hasAttribute('required')) {
        const isEmpty = !value || value.trim() === '';
        console.log(`${name} (${type}): "${value}" ${isEmpty ? '❌ REQUIRED BUT EMPTY' : '✅'}`);
      }
    });
    
    return formData;
  },
  
  // Try to trigger validation manually
  triggerValidation: function() {
    console.log('\n🔄 TRIGGERING VALIDATION');
    console.log('=========================');
    
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      console.log('Found submit button, checking if it\'s enabled...');
      console.log(`Submit button disabled: ${submitButton.disabled}`);
      console.log(`Submit button text: "${submitButton.textContent.trim()}"`);
    }
    
    // Try to find and click the submit button to see validation
    const form = document.querySelector('form');
    if (form) {
      console.log('Attempting to trigger form validation...');
      
      // Create a fake submit event
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  },
  
  // Run all checks
  runAll: function() {
    console.clear();
    console.log('🔍 COMPREHENSIVE VALIDATION DEBUG');
    console.log('==================================');
    
    const validation = this.checkFormValidation();
    const errors = this.checkErrorMessages();
    const inputs = this.checkFormInputs();
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`Validation errors: ${validation.hasErrors ? 'YES' : 'NO'}`);
    console.log(`Error messages in DOM: ${errors.length}`);
    console.log(`Total form inputs: ${Object.keys(inputs).length}`);
    
    if (validation.hasErrors) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Fill in all required fields marked with ❌');
      console.log('2. Check that all dropdowns have valid selections');
      console.log('3. Ensure text fields are not empty');
      console.log('4. Verify that arrays (genres, countries, languages) have at least one item');
    }
    
    return {
      validation,
      errors,
      inputs
    };
  }
};

// Auto-run on load
console.log('🚀 Validation Debug Script Loaded');
console.log('Run: debugValidation.runAll() to check all validation issues');
console.log('Or run individual checks:');
console.log('- debugValidation.checkFormValidation()');
console.log('- debugValidation.checkErrorMessages()');
console.log('- debugValidation.checkFormInputs()');

// Auto-run if we're on a film edit page
if (window.location.hash.includes('feature-films/edit')) {
  console.log('🎬 Detected film edit page, running automatic validation check...');
  setTimeout(() => {
    debugValidation.runAll();
  }, 2000);
}
