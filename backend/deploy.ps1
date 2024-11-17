# Create temporary deployment directory
Write-Host "Creating deployment structure..."
New-Item -ItemType Directory -Force -Path "../deploy/backend" | Out-Null
New-Item -ItemType Directory -Force -Path "../deploy/.platform/hooks/predeploy" | Out-Null

# Copy application files to backend directory
Write-Host "Copying application files..."
# First, copy the directory structure
Get-ChildItem -Path "*" -Directory -Exclude ".platform",".git",".env",".elasticbeanstalk" | ForEach-Object {
    New-Item -ItemType Directory -Force -Path "../deploy/backend/$($_.Name)" | Out-Null
}

# Then copy files maintaining structure
Get-ChildItem -Path "*" -Recurse -File -Exclude ".platform/*",".git/*",".env",".elasticbeanstalk/*" | ForEach-Object {
    $targetPath = $_.FullName.Replace($PWD.Path, "").TrimStart("\")
    $destination = "../deploy/backend/$targetPath"
    $destinationDir = Split-Path -Parent $destination
    if (!(Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $destination -Force
}

# Copy platform files to root
Write-Host "Copying platform files..."
Copy-Item -Path ".platform" -Destination "../deploy/" -Recurse -Force

# Create deployment package
Write-Host "Creating deployment package..."
Set-Location ../deploy

# Remove existing zip if it exists
if (Test-Path ../backend-deploy.zip) {
    Remove-Item ../backend-deploy.zip -Force
}

# Use 7-Zip to create the deployment package with forward slashes
Write-Host "Creating zip file with 7-Zip..."
& "C:\Program Files\7-Zip\7z.exe" a -tzip "../backend-deploy.zip" "./*" "-x!.git" "-x!.env" "-x!.elasticbeanstalk" "-mx=9"

# Clean up
Write-Host "Cleaning up..."
Set-Location ..
Remove-Item -Path deploy -Recurse -Force

Write-Host "Deployment package created: backend-deploy.zip" 

# Add this line after copying files
Copy-Item -Path "requirements.txt" -Destination "../deploy/backend/" -Force
