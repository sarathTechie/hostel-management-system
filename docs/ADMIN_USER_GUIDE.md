# Admin and staff quick guide

## Admin / Warden

- Add resident records from **Students**. The roll number is also used as the Student's username.
- Configure a block and its rooms from **Rooms & beds**. Choose a vacant bed to allocate it to a registered roll number; choose an occupied bed to vacate it. The API preserves the prior allocation history.
- Manage roles and account status in **User accounts**. Password reset sets the supplied temporary password; share it through an approved private channel.
- Review complaints, change status and enter resolution remarks. Add visitors at check-in and mark them out at exit.
- Review leave requests with the **Review** action. Publish notices with an optional expiry date and manage published menus in **Mess menu**.
- View dashboard occupancy and dues summaries. **Reports** lets you filter the supported CSV exports. **Audit history** shows recent tracked administrative changes.

## Accountant / Hostel Clerk

- **Fee management** lists dues and payment history. Add a fee head and due date to generate dues for currently allocated residents.
- Select **Record payment** for an outstanding balance and enter amount, payment mode and optional note. The API rejects overpayments; the database trigger also checks the remaining amount under concurrent requests.
- Use the receipt link to print a receipt. **Reports** exports fee dues and their status.

## Data handling

Use fictional examples during demonstration. Do not enter real student data until the institution's privacy policy, HTTPS deployment, backups, access roles and restore process have been reviewed.
