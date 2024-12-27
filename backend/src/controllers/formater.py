import pandas as pd
import json
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font
from openpyxl.utils import get_column_letter
import sys

def format_test_data(json_data, output_file_path):
    # Create Excel writer object
    writer = pd.ExcelWriter(output_file_file_path, engine='openpyxl')
    
    # Sheet 1: Test Overview
    test_data = json_data['data']['coding'][0]
    overview_data = {
        'Test Name': [test_data['testTitle']],
        'Category': [test_data['category']],
        'Difficulty': [test_data['difficulty']],
        'Maximum Marks': [test_data['totalMarks']],
        'Passing Marks': [test_data['passingMarks']],
        'Total Students': [len(set(s['userId'] for s in json_data['data']['coding']))],
        'Total Attempts': [len(json_data['data']['coding'])],
        'Average Score': [json_data['summary']['averageScore']]
    }
    pd.DataFrame(overview_data).to_excel(writer, sheet_name='Test Overview', index=False)

    # Sheet 2: Student Scores
    student_scores = []
    for student in json_data['data']['coding']:
        mcq_score = 0
        for mcq_submission in json_data['data']['mcq']:
            if mcq_submission['userId'] == student['userId']:
                mcq_score = sum(answer['marks'] for answer in mcq_submission['answers'])
                break
        
        coding_score = sum(challenge['bestScore'] for challenge in student['challenges'])
        
        student_scores.append({
            'Name': student['userName'],
            'Email': student['userEmail'],
            'MCQ Score': mcq_score,
            'Coding Score': coding_score,
            'Total Score': mcq_score + coding_score
        })
    
    pd.DataFrame(student_scores).to_excel(writer, sheet_name='Student Scores', index=False)

    # Sheet 3: MCQ Results
    mcq_results = []
    mcq_questions = []
    if json_data['data']['mcq']:
        mcq_questions = [q['question'][:16] + '...' for q in json_data['data']['mcq'][0]['answers']]
    
    for submission in json_data['data']['mcq']:
        result = {
            'Name': submission['userName'],
            'Email': submission['userEmail']
        }
        for idx, answer in enumerate(submission['answers']):
            result[mcq_questions[idx]] = '✅' if answer['isCorrect'] else '❌'
        mcq_results.append(result)
    
    pd.DataFrame(mcq_results).to_excel(writer, sheet_name='MCQ Results', index=False)

    # Sheet 4: Coding Results
    coding_results = []
    coding_questions = []
    if json_data['data']['coding']:
        coding_questions = [c['challengeTitle'][:16] + '...' for c in json_data['data']['coding'][0]['challenges']]
    
    for submission in json_data['data']['coding']:
        result = {
            'Name': submission['userName'],
            'Email': submission['userEmail']
        }
        for challenge in submission['challenges']:
            result[challenge['challengeTitle'][:16] + '...'] = '✅' if challenge['bestScore'] == 100 else '❌'
        coding_results.append(result)
    
    pd.DataFrame(coding_results).to_excel(writer, sheet_name='Coding Results', index=False)

    # Save and close
    writer.close()
    return output_file_path 

if __name__ == '__main__':
    if len(sys.argv) != 2:  # Changed from 3 to 2 since we only need output path
        print("Usage: python formater.py <output_excel_path>")
        sys.exit(1)
        
    # Remove json_file_path parameter
    output_file_path = sys.argv[1]
    
    # Add test JSON data directly (you'll need to pass your JSON data here)
    json_data = {
        # Your JSON data structure here
    }
    
    format_test_data(json_data, output_file_path) 