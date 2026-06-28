from setuptools import setup, find_packages

setup(
    name="kurohub",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["websocket-client>=1.7.0"],
    python_requires=">=3.9",
    author="KuroHub Team",
    description="Python library for KuroHub IoT Platform — test ESP32 Virtual Pin tanpa hardware",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourname/kurohub",
)
