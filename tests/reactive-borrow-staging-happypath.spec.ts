import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// --- 1. DEFINE THE DATA SHAPE ---
interface TestRecord {
  testName: string;
  url: string;
  loanAmount: string;
  loanReason: string;
  title: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  employmentStatus: string;
  jobTitle: string;
  employmentStartDate: string;
  grossAnnualIncome: string;
  netMonthlyIncome: string;
  otherIncome: string;
  postcode: string;
  selectedAddress: string;
  moveInDate: string;
  housingStatus: string;
  mortgageAmount: string;
  maritalStatus: string;
  dependents: string;
}

class TestReporter {
  private data: any[] = [];
  private outputDir = path.join(process.cwd(), 'test-results');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  addTestData(data: object) {
    this.data.push({
      ...data,
      timestamp: new Date().toISOString(),
      testId: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    });
  }

  generateReport() {
    const report = {
      summary: { totalTests: this.data.length, generatedAt: new Date().toISOString() },
      test: this.data
    };
    const timestamp = Date.now();
    fs.writeFileSync(path.join(this.outputDir, `test-report-${timestamp}.json`), JSON.stringify(report, null, 2));
    this.generateCSV(timestamp);
    return report;
  }

  private generateCSV(timestamp: number) {
    if (this.data.length === 0) return;
    const headers = Object.keys(this.data[0]).join(',');
    const rows = this.data.map(item => 
      Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    fs.writeFileSync(path.join(this.outputDir, `test-report-${timestamp}.csv`), `${headers}\n${rows}`);
  }
}

const reporter = new TestReporter();

// --- 2. ROBUST CSV DATA LOADING ---
const csvFilePath = path.join(process.cwd(), 'test-data.csv');

if (!fs.existsSync(csvFilePath)) {
    console.error(`\n❌ ERROR: Missing data file at: ${csvFilePath}`);
    process.exit(1); 
}

const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true, 
  relax_column_count: true
});

// --- DEBUG BLOCK ---
// This will tell us exactly why the script thinks the columns are missing
if (records.length > 0) {
    console.log('\n--- CSV COLUMN DEBUG ---');
    console.log('The script found these column headers:', Object.keys(records[0]));
    console.log('Total rows found:', records.length);
    console.log('------------------------\n');
}

// --- 3. LOOP THROUGH CSV RECORDS ---
(records as TestRecord[]).forEach((record, index) => {
  test(`Row ${index + 1}: Happy Path - ${record.firstName || 'User'}`, async ({ page }) => {
    test.setTimeout(120000); 

    // Guard against undefined URL
    if (!record.url) {
        console.error(`\n❌ DATA ERROR at Row ${index + 1}:`);
        console.error(`Record Content:`, record);
        throw new Error(`Row ${index + 1} is missing a URL value. Check your CSV headers!`);
    }

    const email = `jt${Math.floor(Math.random() * 100000)}@sf.com`;
    const employeeNumber = `JT${Math.floor(Math.random() * 100000)}`;
    
    reporter.addTestData({ user: record.firstName, status: 'started' });

    // --- BEGIN TEST EXECUTION ---
    await page.goto(record.url);
    await page.getByRole('button', { name: 'Accept Cookies' }).click();
    
    // Loan Details
    await page.locator('#employerBlock button').filter({ hasText: 'Apply for a Loan' }).click();
    // 1. Wait for the URL to change to the application page
    await page.waitForURL(/.*app-rec.*/, { timeout: 15000 });

    // 2. Locate the field using a Regular Expression (handles 4,000 or 4000)
    // We also use 'first()' in case there are hidden duplicate inputs
    const loanInput = page.locator('input[placeholder*="4"], input[type="number"]').first();

    // 3. Wait for it to be ready for typing
    await loanInput.waitFor({ state: 'visible', timeout: 15000 });

    // 4. Click and fill
    await loanInput.click();
    await loanInput.fill(record.loanAmount);
    await loanInput.fill(record.loanAmount);
    await page.getByRole('button', { name: 'select reason for loan' }).click();
    await page.getByText(record.loanReason, { exact: true }).click();
    await page.locator('.v-input--selection-controls__ripple').first().click();
    await page.getByRole('button', { name: 'button' }).click();
    
    // Personal Details
    await page.getByRole('radio', { name: record.title, exact: true }).click();
    await page.getByRole('textbox', { name: 'First name' }).fill(record.firstName);
    await page.getByRole('textbox', { name: 'Last name' }).fill(record.lastName);
    await page.getByRole('textbox', { name: 'DD/MM/YYYY' }).fill(record.dob);
    await page.getByRole('textbox', { name: 'e.g. ABC001' }).fill(employeeNumber);
    await page.getByRole('textbox', { name: 'Mobile Phone' }).fill(record.phone);
    await page.locator('button').filter({ hasText: 'Next' }).click();
    
    // Account Creation
    await page.getByRole('textbox', { name: 'Personal email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Confirm email' }).fill(email);
    await page.getByRole('textbox', { name: 'e.g Tr0ub4dor&' }).fill('Klopklop900-');
    await page.locator('button').filter({ hasText: 'Next' }).click();
    
    await page.waitForTimeout(4000);
    await page.getByText(/I agree to the Salary Finance/i).click();
    await page.getByText(/I'm happy for Salary Finance/i).click();
    await page.locator('button').filter({ hasText: 'Create Account' }).click();
    await page.waitForTimeout(5000);
    
    // Employment Details
    await page.getByRole('radio', { name: record.employmentStatus, exact: true }).click();
    await page.getByRole('textbox', { name: 'Job Title' }).fill(record.jobTitle);
    await page.getByRole('textbox', { name: 'MM/YYYY' }).fill(record.employmentStartDate);
    
    // Target specifically text/number inputs, excluding radios
    const incomeInputs = page.locator('input[id^="input-"][type="text"], input[id^="input-"][type="number"]');

    // Alternatively, use the ARIA labels which are much more stable
    await page.locator('#input-291, #input-290').fill(record.grossAnnualIncome);
    await page.locator('#input-295, #input-294').fill(record.netMonthlyIncome);
    await page.locator('#input-299, #input-298').fill(record.otherIncome);

    await page.getByRole('checkbox', { name: /happy for/i }).click();
    await page.getByRole('button', { name: 'button' }).click();
    
    // Address Details
    await page.getByRole('textbox', { name: 'Postcode' }).fill(record.postcode);
    await page.locator('#address-btn').click();
    await page.getByRole('button', { name: /select your address/i }).click();
    await page.getByText(record.selectedAddress).click();
    await page.getByRole('textbox', { name: 'MM/YYYY' }).fill(record.moveInDate);
    await page.locator('button').filter({ hasText: 'Next' }).click();
    
    // Housing/Submit
    await page.getByRole('radio', { name: record.housingStatus, exact: true }).click();
    await page.getByRole('spinbutton').fill(record.mortgageAmount);
    await page.locator('button').filter({ hasText: 'Next' }).click();
    
    await page.getByRole('radio', { name: record.maritalStatus, exact: true }).click();
    await page.getByRole('radio', { name: record.dependents, exact: true }).click();
    await page.locator('button').filter({ hasText: 'Next' }).click();
    
    await page.getByRole('radio', { name: 'No' }).click();
    await page.locator('button').filter({ hasText: 'Next' }).click();
    await page.locator('button').filter({ hasText: 'Continue' }).click();
    await page.getByRole('checkbox', { name: /happy for my employer to/i }).click();
    await page.locator('button').filter({ hasText: 'Continue' }).click();
    await page.locator('button').filter({ hasText: 'Submit Application' }).click();
    
    await expect(page.getByRole('heading', { name: 'Your application is being' })).toBeVisible();
    
    const screenshotPath = path.join(process.cwd(), 'test-results', 'screenshots', `row-${index + 1}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    reporter.addTestData({ user: record.firstName, status: 'completed', screenshot: screenshotPath });
    await page.close();
  });
});

test.afterAll(() => {
  reporter.generateReport();
});