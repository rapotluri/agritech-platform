#!/bin/bash

# Enable debug mode
set -x

echo "Starting deployment script..."

# Install system dependencies for Amazon Linux 2023
sudo dnf install -y python3-devel gcc
sudo dnf install -y gdal gdal-devel
sudo dnf install -y proj proj-devel
sudo dnf install -y geos geos-devel

# Create and activate virtual environment
python3 -m venv /var/app/venv/staging-LQM1lest
source /var/app/venv/staging-LQM1lest/bin/activate

# Set PYTHONPATH
export PYTHONPATH=/var/app/current
echo "export PYTHONPATH=/var/app/current" >> /etc/profile
echo "export PYTHONPATH=/var/app/current" >> ~/.bashrc

# Debug: Print Python info
which python
python --version
echo "PYTHONPATH=$PYTHONPATH"

# Install packages
pip install --upgrade pip
cd /var/app/current/backend
pip install -r requirements.txt

# Debug: List installed packages
echo "Installed packages:"
pip list

# Debug: Print current directory structure
echo "Current directory structure:"
ls -la /var/app/current

echo "Deployment script completed"

# Add this line at the end
chmod -x /var/app/staging/.platform/hooks/predeploy/__init__.py