# MRI Prostata Befund Generator

A structured prostate MRI report generator based on PI-RADSv2.1 guidelines.

## 🚀 Live Demo

Visit the application: [https://dederanos.github.io/PIRADS_reporting/](https://dederanos.github.io/PIRADS_reporting/)

## 📋 Features

- **Structured Reporting**: Generate comprehensive prostate MRI reports following PI-RADSv2.1 standards
- **Interactive Interface**: User-friendly web interface with form-based input
- **Volume Calculations**: Automatic prostate volume and PSA density calculations
- **Visual Annotations**: Interactive prostate diagram for lesion marking
- **Export Options**: Copy reports in HTML or plain text format
- **Clinical Settings**: Support for different clinical scenarios (Primary diagnostics, Active Surveillance)
- **Multi-language Support**: German language interface

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with modern design principles
- **Deployment**: GitHub Pages
- **Version Control**: Git/GitHub

## 🏥 Medical Context

This tool is designed for radiologists and medical professionals working with prostate MRI examinations. It helps standardize reporting according to:

- PI-RADSv2.1 (Prostate Imaging Reporting and Data System)
- Structured reporting guidelines
- Clinical best practices for prostate imaging

## 📁 Project Structure

```
├── index.html          # Main application interface
├── app.js             # Core application logic
├── style.css          # Styling and layout
├── *.png             # Logo and diagram images
└── .github/
    └── workflows/
        └── deploy.yml # GitHub Pages deployment
```

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Dederanos/PIRADS_reporting.git
   cd PIRADS_reporting
   ```

2. Open `index.html` in your web browser or serve it using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. Navigate to `http://localhost:8000` (or the appropriate local URL)

## 📊 Usage

1. **Clinical Setting**: Select the appropriate clinical context
2. **Patient Information**: Enter previous examination details and PSA values
3. **Measurements**: Input prostate dimensions for automatic volume calculation
4. **Quality Assessment**: Set image quality parameters
5. **Findings**: Document lesions using the interactive diagram
6. **Report Generation**: Generate and copy the structured report

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is for educational and medical professional use. Please ensure compliance with local medical software regulations.

## ⚠️ Disclaimer

This tool is designed to assist medical professionals in generating structured reports. It should not replace clinical judgment or serve as the sole basis for medical decisions. Always verify results and ensure compliance with institutional guidelines.

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Note**: This application is optimized for desktop browsers and medical workstation environments.


---
Deployment: https://github.com/Dederanos/PIRADS_reporting/actions/workflows/deploy.yml
Live: https://dederanos.github.io/PIRADS_reporting/
