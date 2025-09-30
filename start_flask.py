#!/usr/bin/env python3
"""
Script to start Flask from the correct app directory
"""

import os
import sys
import subprocess

def start_flask():
    """Start Flask from the correct app directory"""
    
    # Hardcode the correct path to the app directory
    app_dir = "/Users/markmariano/Documents/Vermillion/app"
    
    # Verify the directory exists
    if not os.path.exists(app_dir):
        print(f"❌ Error: App directory not found at {app_dir}")
        return False
    
    # Verify main.py exists in the app directory
    main_py_path = os.path.join(app_dir, "main.py")
    if not os.path.exists(main_py_path):
        print(f"❌ Error: main.py not found at {main_py_path}")
        return False
    
    print(f"✅ Starting Flask from: {app_dir}")
    print(f"✅ Using main.py at: {main_py_path}")
    
    try:
        # Change to the app directory
        os.chdir(app_dir)
        print(f"✅ Changed working directory to: {os.getcwd()}")
        
        # Start Flask
        print("🚀 Starting Flask server...")
        subprocess.run([sys.executable, "main.py"], cwd=app_dir)
        
    except Exception as e:
        print(f"❌ Error starting Flask: {str(e)}")
        return False
    
    return True

if __name__ == '__main__':
    print("🐍 Starting Flask from the correct app directory...")
    success = start_flask()
    
    if not success:
        print("\n❌ Failed to start Flask")
        sys.exit(1)
