# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in MyFoodMetrics, please report it responsibly:

### Private Disclosure Process

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. **Email**: security@myfoodmetrics.com (if available) or create a private security advisory
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment of your report
- **7 days**: Preliminary assessment and severity classification
- **30 days**: Fix development and testing
- **Public disclosure**: After fix is deployed and verified

### Security Best Practices

#### For Contributors:
- Never commit API keys, passwords, or tokens to the repository
- Use environment variables for all sensitive configuration
- Run security linters before submitting PRs
- Review dependencies for known vulnerabilities

#### For Users:
- Keep your API keys secure and rotate them regularly
- Use strong passwords for your accounts
- Enable two-factor authentication where available
- Report suspicious activity immediately

## Security Features

- **Authentication**: Secure session management with Replit Auth
- **Data Protection**: End-to-end encryption for sensitive user data
- **API Security**: Rate limiting and input validation on all endpoints
- **File Upload**: Secure presigned URL uploads with content validation
- **Payment Security**: PCI-compliant payment processing via Stripe

## Vulnerability Disclosure

We follow responsible disclosure principles and will:
- Work with security researchers to verify and fix reported issues
- Provide credit to researchers who report valid vulnerabilities
- Maintain transparency about security improvements

Thank you for helping keep MyFoodMetrics secure!