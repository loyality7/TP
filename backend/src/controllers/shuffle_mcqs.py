import json
import random

# Read the JSON file with UTF-8 encoding
with open('test2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Shuffle the MCQs
random.shuffle(data['mcqs'])
random.shuffle(data['codingChallenges'])

# Write back to file with UTF-8 encoding
with open('test2.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2) 