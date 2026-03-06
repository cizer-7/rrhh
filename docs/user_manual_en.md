# 📚 User Manual - Payroll Digitalization

## 📋 Table of Contents

1. [🎯 Introduction](#-introduction)
2. [🚀 Getting Started](#-getting-started)
3. [🔐 Authentication and Security](#-authentication-and-security)
4. [👥 Employee Management](#-employee-management)
5. [💳 Salary Management](#-salary-management)
6. [📊 Import and Export](#-import-and-export)
7. [⚙️ Advanced Functions](️-advanced-functions)
8. [❓ Frequently Asked Questions](#-frequently-asked-questions)

---

## 🎯 Introduction

### What is the Payroll Digitalization System?

The Payroll Digitalization System is a modern web application for employee management and payroll processing. It replaces traditional desktop applications with a web-based solution.

### Key Features

- **Employee Management:** Complete CRUD operations for master data
- **Payroll Processing:** Calculation and salary management
- **Secure Authentication:** Login with JWT and password recovery
- **Import/Export:** Integration with Excel and other formats
- **Carry Over:** Transfer of amounts between periods
- **FTE Management:** Control of full-time equivalent percentages

### System Architecture

- **Frontend:** Next.js 16 with TypeScript and Tailwind CSS
- **Backend:** Python Flask with MySQL
- **Database:** MySQL with optimized tables
- **API:** RESTful with JWT authentication

---

## 🚀 Getting Started

### System Requirements

#### Supported Browsers
- **Chrome:** Version 90 or higher
- **Firefox:** Version 88 or higher
- **Safari:** Version 14 or higher
- **Edge:** Version 90 or higher

#### System Access

1. **Main URL:** Access the web application
2. **Login:** Enter credentials
3. **Dashboard:** Access the main panel

### Main Page

The main page shows three main modules:

- **👥 Employee Management:** Master data administration
- **💰 Payroll Processing:** Salary management
- **📊 Reports and Export:** Analysis tools

---

## 🔐 Authentication and Security

### Login

#### Authentication Process

1. **Credentials:** Username and password
2. **Validation:** Database verification
3. **JWT Token:** Session token generation
4. **Access:** Dashboard redirection

### Password Recovery

#### Recovery Flow

1. **Request:** "Forgot Password?"
2. **Email:** Send recovery link
3. **Validation:** Verify token (24 hours valid)
4. **Update:** Set new password

#### Password Requirements

- **Minimum Length:** 8 characters
- **Complexity:** Uppercase, lowercase, numbers, special characters
- **Security:** No reuse of previous passwords

---

## 👥 Employee Management

### Employee Overview

#### Employee Table

The interface shows a table with:

- **Employee ID:** Unique identifier
- **Name:** Full employee name
- **CECO:** Cost center
- **Category:** "Techniker" or "Office"
- **Active:** Employee status
- **Hire Date:** Contract start date

#### Available Functions

- **Search:** By name, last name, CECO
- **Filters:** By category, active status
- **Sorting:** By ID, name, date
- **Pagination:** Navigate through results

### Create New Employee

#### Creation Form

**Required Fields:**
- Name and Last Name
- CECO (Cost Center)
- Category (Techniker/Office)
- DNI

**Optional Fields:**
- Hire Date
- Declaration
- Active Status

**Process:**
1. **Personal Data:** Complete basic information
2. **Work Data:** CECO, category, hire date
3. **Validation:** System checks required data
4. **Creation:** Save to database

### Edit Employee

#### Data Modification

**Editable Fields:**
- Name and Last Name
- CECO
- Category
- Status (Active/Inactive)
- Hire Date
- Declaration
- DNI

**Restrictions:**
- Employee ID not modifiable
- Format validations applied

### Delete Employee

#### Deletion Process

- **Confirmation:** Confirmation dialog
- **Logical Deletion:** Mark as inactive
- **Integrity:** Maintain historical data

### Employee Categories

#### Techniker
- Technical specialized staff
- Access to technical functions
- Specific configuration

#### Office
- Administrative staff
- Access to office functions
- Administrative configuration

---

## 💳 Salary Management

### Salary Information

#### Salary Structure

**Main Data:**
- **Year:** Payroll period
- **Modality:** 12 or 14 payments
- **Annual Gross Salary:** Taxable base
- **Seniority:** Seniority allowance
- **Other Concepts:** Additional allowances

#### Yearly Management

- **Creation:** Set annual salary
- **Update:** Modify salary data
- **Deletion:** Remove salary record

### FTE (Full-Time Equivalent)

#### Percentage Management

**Functionality:**
- **Percentage:** Part-time/full-time (0-100%)
- **Period:** Management by year and month
- **Update:** Modify percentages
- **Calculation:** Automatic application in payroll

#### Operations

- **Query:** View FTE by period
- **Update:** Modify percentage
- **Deletion:** Remove FTE record

### Einkünfte (Income)

#### Income Management

**Income Types:**
- **Gross Income:** Monthly income
- **Earned:** Earned concepts
- **Allowances:** Additional payments

#### Period Operations

- **Annual:** Annual income configuration
- **Monthly:** Monthly details
- **Update:** Modify amounts

### Deductions

#### Deduction Management

**Deduction Types:**
- **Social Security:** Mandatory contributions
- **IRPF:** Tax withholdings
- **Others:** Specific deductions

#### Operations

- **Configuration:** Set percentages
- **Update:** Modify deductions
- **Calculation:** Automatic application

---

## 📊 Import and Export

### Data Import

#### Hours and Per Diems

**Functionality:**
- **Excel File:** Upload file with hours/per diems
- **Validation:** Format verification
- **Processing:** Automatic import
- **Confirmation:** Import results

#### Gasoline Import

- **Excel File:** Load gasoline expenses
- **Validation:** Check structure
- **Processing:** Import data
- **Report:** Operation results

#### Coupon Specification

- **Import:** Load specific coupons
- **Validation:** Verify data
- **Processing:** Integrate into system

### Data Export

#### Excel Export

**Export Types:**
- **Annual:** All year data
- **Monthly:** Specific month data
- **Per Employee:** Individual data

**Available Formats:**
- **Excel:** .xlsx format with formulas
- **IRPF:** Tax report
- **Payroll Entry:** Accounting format

#### Export Process

1. **Selection:** Choose period and type
2. **Generation:** Create file
3. **Download:** Download generated file
4. **Confirmation:** Verify export

---

## ⚙️ Advanced Functions

### Carry Over

#### Amount Transfer

**Concept:**
- **Source:** Source period (year/month)
- **Destination:** Application period
- **Concept:** Amount type
- **Amount:** Amount to transfer

#### Operations

- **Creation:** New carry over
- **Query:** View existing carry overs
- **Deletion:** Remove carry over
- **Application:** Apply in payroll

### Edit History

#### Change Tracking

**Functionality:**
- **Log:** All data changes
- **Timestamp:** Modification date and time
- **User:** Who made the change
- **Field:** Modified field

#### History Query

- **Per Employee:** Individual history
- **Global:** All changes
- **Dates:** Filter by period

### Salary Copy Manager

#### Salary Copy

**Functionality:**
- **Source:** Base year salary
- **Destination:** Target year
- **Adjustments:** Percentage modifications
- **Validation:** Data verification

---

## ❓ Frequently Asked Questions

### Access Questions

**Q: What should I do if I forgot my password?**
A: Use the "Forgot Password" function and follow the email instructions.

**Q: Can I access from multiple devices?**
A: Yes, but only one active session per user.

**Q: Why does my session expire?**
A: For security, sessions have an inactivity time limit.

### Employee Questions

**Q: Can I change an employee ID?**
A: No, the ID is unique and not modifiable to maintain data integrity.

**Q: What does the "Techniker" category mean?**
A: It's technical staff with access to specialized functions.

**Q: How is FTE calculated?**
A: It's the percentage of full-time, affecting proportional calculations.

### Salary Questions

**Q: What's the difference between 12 and 14 payments?**
A: 12 payments are regular monthly, 14 include additional payments.

**Q: Can I modify previous year salaries?**
A: Yes, with appropriate permissions and system validation.

**Q: How are deductions applied?**
A: Automatically according to percentage configuration and tables.

### Import/Export Questions

**Q: What format should import files have?**
A: Excel with specific structure according to data type.

**Q: Can I export data from multiple employees at once?**
A: Yes, exports can be annual or monthly for all employees.

**Q: What does the IRPF report include?**
A: Tax data needed for tax declaration.

### Technical Questions

**Q: Do I need to install any software?**
A: No, it's a web application accessible from browser.

**Q: Which browsers are compatible?**
A: Chrome, Firefox, Safari, Edge in recent versions.

**Q: Are my data secure?**
A: Yes, with SSL encryption and JWT authentication.

---

## 📞 Technical Support

### Contact

**System Administrator:**
- **Direct Contact:** System administrator for support requests

### Additional Resources

**Documentation:**
- Installation manual
- API guide
- Best practices

---

**Manual Version:** 2.1  
**Last Update:** March 2026  
**Based on:** Current software version

---

*This manual reflects the currently implemented functions in the system.*
