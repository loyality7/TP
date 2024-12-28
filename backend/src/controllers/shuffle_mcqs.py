import json
import random

# Read the JSON file
with open('test2.json', 'r') as f:
    data = json.load(f)

# Shuffle the MCQs
random.shuffle(data['codingChallenges'])

# Write back to file
with open('test2.json', 'w') as f:
    json.dump(data, f, indent=2) 