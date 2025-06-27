#!/usr/bin/env python3
import os
import sys

def is_valid_utf8(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            f.read()
        return True
    except UnicodeDecodeError as e:
        return str(e)
    except Exception as e:
        return f"Error reading file: {str(e)}"

def scan_directory(directory):
    invalid_files = []
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .git directories
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            filepath = os.path.join(root, file)
            result = is_valid_utf8(filepath)
            if result is not True:
                invalid_files.append((filepath, result))
    
    return invalid_files

if __name__ == "__main__":
    directory = os.path.dirname(os.path.abspath(__file__))
    print(f"Scanning directory: {directory}")
    invalid_files = scan_directory(directory)
    
    if not invalid_files:
        print("✓ All files are valid UTF-8")
    else:
        print("\nFound files with invalid UTF-8 encoding:")
        for filepath, error in invalid_files:
            print(f"\nFile: {filepath}")
            print(f"Error: {error}")
        sys.exit(1)
