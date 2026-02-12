import { test, expect } from '@playwright/test';
import fs from 'fs';

class TestReporter {
  private data: any[] = [];
  
  addTestData(data: object) {
    this.data.push({
      ...data,
      timestamp: new Date().toISOString(),
      testId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  generateReport() {
    const report = {
      summary: {
        totalTests: this.data.length,
        generatedAt: new Date().toISOString()
      },
      test: this.data
    };
    
    // Save as JSON
    fs.writeFileSync(
      `test-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    // Save as CSV
    this.generateCSV();
    
    return report;
  }
  
  private generateCSV() {
    if (this.data.length === 0) return;
    
    const headers = Object.keys(this.data[0]).join(',');
    const rows = this.data.map(item => 
      Object.values(item).map(val => 
        `"${String(val).replace(/"/g, '""')}"`
      ).join(',')
    ).join('\n');
    
    fs.writeFileSync(
      `test-report-${Date.now()}.csv`,
      `${headers}\n${rows}`
    );
  }
}

// Create global reporter instance
const reporter = new TestReporter();

test('happy-path', async ({ page }) => {
  // Generate unique test data
  const randomNumber = Math.floor(Math.random() * 100000);
  const email = `jt${randomNumber}@sf.com`;
  const randomEmployeeNumber = Math.floor(Math.random() * 100000);
  const employeeNumber = `JT${randomEmployeeNumber}`;
  
  // Define all test data - use 'any' type or create a proper interface
  const testData: any = {
    testName: 'Complete Loan Application Test',
    url: 'https://rc-borrowui.saldev.net/app-rec/BorrowHome',
    inputs: {
      // Page 1: Loan Details
      loanAmount: '2000',
      loanReason: 'rent deposit',
      
      // Page 2: Personal Details
      title: 'Ms',
      firstName: 'JoTest',
      lastName: 'TheWater',
      dob: '01/01/1980',
      employeeId: employeeNumber,
      phone: '07452856254',
      
      // Page 3: Account Creation
      email: email,
      confirmEmail: email,
      password: 'Klopklop900-',
      
      // Page 4: Employment Details
      employmentStatus: 'Employed Full Time',
      jobTitle: 'TheBoss',
      employmentStartDate: '01/2000',
      grossAnnualIncome: '61000',
      netMonthlyIncome: '0',
      otherIncome: '0',
      
      // Page 5: Address Details
      postcode: 'E16AN',
      selectedAddress: '12A Brushfield Street, London',
      moveInDate: '01/2000',
      
      // Page 6: Housing Details
      housingStatus: 'Owner (mortgage)',
      mortgageAmount: '200',
      
      // Page 7: Marital Status
      maritalStatus: 'Widowed',
      dependents: '0',
      
      // Page 8: Court Orders
      courtOrders: 'No',
      
      // Agreements
      agreement1: true, // I agree to the Salary Finance
      agreement2: true, // I'm happy for Salary Finance
      agreement3: true, // I'm happy for the employer to
      agreement4: true, // I'm happy for my employer to
    },
    generatedValues: {
      email: email,
      employeeNumber: employeeNumber,
      randomNumber: randomNumber,
      randomEmployeeNumber: randomEmployeeNumber
    },
    status: 'started',
    startTime: new Date().toISOString()
  };

  // Add initial test data to reporter
  reporter.addTestData(testData);

  // Log start
  console.log(`Starting test with Employee ID: ${employeeNumber}, Email: ${email}`);

  // Begin test execution
  await page.goto('https://rc-borrowui.saldev.net/app-rec/BorrowHome');
  await page.getByRole('button', { name: 'Accept Cookies' }).click();
  
  // Loan Details
  await page.locator('#employerBlock button').filter({ hasText: 'Apply for a Loan' }).click();
  await page.getByRole('spinbutton', { name: '4,000' }).click();
  await page.getByPlaceholder('4,000').fill(testData.inputs.loanAmount);
  await page.getByRole('button', { name: 'select reason for loan' }).click();
  await page.getByText(testData.inputs.loanReason).click();
  await page.locator('.v-input--selection-controls__ripple').first().click();
  await page.getByRole('button', { name: 'button' }).click();
  
  // Personal Details
  await page.getByRole('radio', { name: testData.inputs.title }).click();
  await page.getByRole('textbox', { name: 'First name' }).fill(testData.inputs.firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(testData.inputs.lastName);
  await page.getByRole('textbox', { name: 'DD/MM/YYYY' }).fill(testData.inputs.dob);
  await page.getByRole('textbox', { name: 'e.g. ABC001' }).fill(testData.inputs.employeeId);
  await page.getByRole('textbox', { name: 'Mobile Phone' }).fill(testData.inputs.phone);
  await page.locator('button').filter({ hasText: 'Next' }).click();
  
  // Account Creation
  await page.getByRole('textbox', { name: 'Personal email address' }).click();
  await page.getByRole('textbox', { name: 'Personal email address' }).fill(testData.inputs.email);
  await page.getByRole('textbox', { name: 'Confirm email' }).fill(testData.inputs.confirmEmail);
  await page.getByRole('textbox', { name: 'e.g Tr0ub4dor&' }).fill(testData.inputs.password);
  
  // Fix the visibility check and click
  await page.locator('button').filter({ hasText: 'Next' }).waitFor({ state: 'visible' });
  await page.locator('button').filter({ hasText: 'Next' }).click();
  
  await page.waitForTimeout(4000);
  
  // Agreements
  await page.getByText('I agree to the Salary Finance').click();
  await page.getByText('I\'m happy for Salary Finance').click();
  await page.waitForTimeout(3000);
  await page.locator('button').filter({ hasText: 'Create Account' }).dblclick();
  await page.waitForTimeout(5000);
  
  // Employment Details
  await page.getByRole('radio', { name: testData.inputs.employmentStatus }).click();
  await page.getByRole('textbox', { name: 'Job Title' }).fill(testData.inputs.jobTitle);
  await page.getByRole('textbox', { name: 'MM/YYYY' }).fill(testData.inputs.employmentStartDate);
  await page.getByRole('heading', { name: /^Your Income From/ }).click();
  await page.locator('#input-291').fill(testData.inputs.grossAnnualIncome);
  await page.locator('#input-295').fill(testData.inputs.netMonthlyIncome);
  await page.locator('#input-299').fill(testData.inputs.otherIncome);
  await page.waitForTimeout(3000);
  await page.getByRole('checkbox', { name: 'happy for' }).click();
  await page.getByRole('button', { name: 'button' }).click();
  
  // Address Details
  await page.getByRole('textbox', { name: 'Postcode' }).fill(testData.inputs.postcode);
  await page.locator('#address-btn').click();
  await page.getByRole('button', { name: 'Please select your address' }).click();
  await page.getByText(testData.inputs.selectedAddress).click();
  await page.locator('.v-input').click();
  await page.getByRole('textbox', { name: 'MM/YYYY' }).fill(testData.inputs.moveInDate);
  await page.locator('button').filter({ hasText: 'Next' }).click();
  await page.waitForTimeout(1000);
  
  // Housing Details
  await page.getByRole('radio', { name: testData.inputs.housingStatus }).click();
  await page.getByRole('spinbutton', { name: 'How much is your share of the' }).fill(testData.inputs.mortgageAmount);
  await page.locator('button').filter({ hasText: 'Next' }).click();
  
  // Marital Status
  await page.getByRole('radio', { name: testData.inputs.maritalStatus }).click();
  await page.getByRole('radio', { name: testData.inputs.dependents }).click();
  await page.locator('button').filter({ hasText: 'Next' }).click();
  
  // Court Orders
  await page.getByRole('radio', { name: 'No' }).click();
  await page.locator('button').filter({ hasText: 'Next' }).click();
  
  // Continue to agreements
  await page.locator('button').filter({ hasText: 'Continue' }).click();
  await page.getByRole('checkbox', { name: 'happy for my employer to' }).click();
  await page.locator('button').filter({ hasText: 'Continue' }).click();
  
  // Submit Application
  await page.locator('button').filter({ hasText: 'Submit Application' }).click();
  
  // Verification steps
  await page.waitForTimeout(5000);
  await expect(page.getByRole('heading', { name: 'Your application is being' })).toBeVisible();
  await expect(page.getByText('We will be in touch with you')).toBeVisible();
  await expect(page.getByText('Please check your junk mail')).toBeVisible();
  await expect(page.locator('.flex-grow-1')).toBeVisible();
  
  // Take screenshot for evidence
  const screenshotPath = `screenshots/application-${employeeNumber}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  // Create a new completed test data object
  const completedTestData = {
    ...testData,
    status: 'completed',
    completedAt: new Date().toISOString(),
    screenshot: screenshotPath,
    verification: {
      applicationSubmitted: true,
      confirmationVisible: true,
      allElementsVerified: true
    }
  };
  
  // Add final data to reporter
  reporter.addTestData(completedTestData);
  
  // Close page
  await page.close();
  
  // Log completion
  console.log(`Test completed successfully for Employee ID: ${employeeNumber}`);
  console.log(`Screenshot saved: ${screenshotPath}`);
});

// Generate report after all tests
test.afterAll(() => {
  const report = reporter.generateReport();
  console.log('\n=== TEST REPORT GENERATED ===');
  console.log(`Total tests recorded: ${report.summary.totalTests}`);
  console.log(`Report generated at: ${report.summary.generatedAt}`);
  console.log(`JSON report: test-report-*.json`);
  console.log(`CSV report: test-report-*.csv`);
  console.log('============================\n');
});

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}