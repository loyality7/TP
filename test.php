<?php
/*
Template Name: custom problems
*/

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'execute') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log the input data for debugging
    error_log("Received input: " . print_r($input, true));

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['output' => 'Error: Invalid JSON input.']);
        http_response_code(400);
        exit();
    }

    $code = $input['data']['code'] ?? '';
    $inputs = $input['data']['input'] ?? '';
    $language = $input['data']['language'] ?? '';

    // Log the received language
    error_log("Received language: " . $language);

    $language_to_faas = [
        'c' => 'c-runner',
        'cpp' => 'cpp-runner',
        'java' => 'java-runner',
        'python3' => 'python3-runner',
        'javascript' => 'js-runner'
    ];

    if (!isset($language_to_faas[$language])) {
        echo json_encode(['output' => 'Error: Unsupported language or language not selected. Received language: ' . $language]);
        http_response_code(400);
        exit();
    }

     $faas_function = $language_to_faas[$language];
    $requestId = uniqid('req_');
    $payload = json_encode([
        'code' => $code, 
        'inputs' => $inputs,
        'requestId' => $requestId
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://interpreter.hysterchat.com/function/$faas_function");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
     $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  
    if (curl_errno($ch) || $http_code !== 200) {
        echo json_encode(['output' => $response, 'requestId' => $requestId]);
    } else {
        $response_data = json_decode($response, true);

        if (isset($response_data['error']) && $response_data['error'] !== '') {
            echo json_encode(['output' => 'Error: ' . $response_data['error'], 'requestId' => $requestId]);
        } else if (isset($response_data['requestId']) && $response_data['requestId'] === $requestId) {
            echo json_encode(['output' => $response_data['result'], 'requestId' => $requestId]);
        } else {
            echo json_encode(['output' => 'Error: Response mismatch', 'requestId' => $requestId]);
        }
    }

    curl_close($ch);
    exit();
}

get_header();
if (!is_user_logged_in()) {
    echo "Please log in to access this page.";
    get_footer();
    return;
}
$current_user_id = get_current_user_id();

 

?>
<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
          <link rel="stylesheet" href="<?php echo home_url(); ?>/codemirror/lib/codemirror.css">
          <script src="<?php echo home_url(); ?>/codemirror/lib/codemirror.js"></script>
          <script src="<?php echo home_url(); ?>/codemirror/mode/clike/clike.js"></script>
          <link rel="stylesheet" href="<?php echo home_url(); ?>/codemirror/theme/dracula.css">
          <script src="<?php echo home_url(); ?>/codemirror/addon/edit/closebrackets.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
       <style>
            .question-and-codeEditor{
                display: flex;
            }
            .question{
              
                background-color: #fbfbfb;
                box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                width: 35vw;
                border-right: 7px solid #0073E6;
                height: 500px;
                overflow: scroll;
                overflow-x:hidden;
                overflow-y:scroll;
            }
            .question::-webkit-scrollbar {
              display: none;
            }
               .tent {
                 margin-bottom: 20px;
                margin-left: 15px;
                margin-right: 15px;
             }
            .animation{
                  padding: 10px 15px;
                  font-size: 14px;
                  text-align: center;
                  text-transform: none;
                  cursor: pointer;
                  outline: none;
                  color: #fff;
                  background-color :#2F323D;
                  border: none;
                  border-radius: 10px;
                  margin-bottom:40px;
            }
            
          
            .language-choice{
                display: flex;
                justify-content: space-between;
            }
            
            .language-choice #language{
                width:200px;
                margin-bottom:30px;
                padding: 10px;
                border-radius:10px;
            }

            #compile{
                background-color: #074507;
            }
            
            #compile:hover{
                background-color: #5b644a;
            }
            .resetbutton{
                color:#C90942;
            }
            .submitbutton{
                color:#FFC100;
            }
            
            #testResults{
                /*margin-top: 100px;*/
                width:62%;
                float:right;
                margin-left:20px;
                background-color: transparent;;
                border-radius:15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                 
            }
            .blank{
                width: 39vw;
            }
            .languageSelection{
                margin-left: 100px;
            }
            .compilerButtons{
                display: flex;
                flex-direction: column;
                width: 59vw;
            }
            .RunSubmit{
                display: flex;
                justify-content: space-around;
            }
             
            @media(min-width:1200px){
                #mobile-mode-display-buttons{
                  display:none;
                }
            }
            @media (min-width:701px) and (max-width: 1200px) {
               .question-and-codeEditor{
                display: flex;
               } 
              #mobile-mode-display-buttons{
                  display:none;
              }
               .question{
                        width: 50%;
               }
               .code-editor{
                    width:50%;
                }
            }
            @media (min-width:501px) and (max-width:700px){
                .compilerButtons {
                    display: flex;
                    flex-direction: column;
                    width: 300vw;
                }
                 .question-and-codeEditor{
                    display: flex;
                   } 
                   .question{
                        width: 37%;
               }
               #mobile-mode-display-buttons{
                  display:none;
              }
               .code-editor{
                    width:63%;
                }
                 .language-choice #language {
                    height:65px;
                    width:160px;
                    margin-bottom:30px;
                }
                 #testResults{
                width:88%;
            }
            }
            @media (max-width:500px){
                .blank {
                    width: 0vw;
                }
                 #testResults{
                width:100%;
            }
                .compilerButtons {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .question-and-codeEditor{
                display: flex;
                flex-direction:column;
               }
               .question{
                       box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                        width: 100%;
               }
               #language{
                    width: 50%;
                    margin-left: 22.5%;
                }
                .languageSelection {
                     margin-left: 0px; 
                }
                 #mobile-mode-display-buttons{
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    margin-top: 15px;
                }
                #mobilesubmitbutton{
                    color:#FFC100;
                }
                #mobileresetbutton{
                    color:#C90942;
                }
                .resetbutton{
                    display:none;
                }
                .submitbutton{
                    display:none;
                }
                #mobilesubmitbutton{
                    display:block;
                }
                
            }
            .compiler_quesrion_container{
                margin-top:15px;
            }
            .compiler_h2_tags_problem{
                font-size: 18px;
                    font-weight: 500;
                    margin-top: 15px;
                    margin-bottom: 10px;
                       color: #383838;
                    border-left: 4px solid #0073e6;
                    padding-left: 10px;
            }
            .compiler_problem_p_tags{
                 font-size: 15px;
                line-height: 19px;
                margin-bottom: 15px;
                word-break: break-word;
                margin-left: 15px;
                color: #383838;
            }
            .compiler_input_p_tags{
                background-color: #f6f8fa;
                /*background-color: #1e2936;  for darkmode*/
                color: #383838;
                /*color: #bdc1c6; for dark mode */
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                overflow: hidden;
                overflow-x: auto;
                max-height: 150px;
                overflow: overlay;
            }
             .separator {
        text-align: center;
        margin: 20px 0;
    }
    .separator hr {
        border: none;
        height: 1px;
        background-color: #ccc;
        margin: 0 auto;
        width: 50%;
    }
    #compiler_challenge_friend{
        float:right;
        display:flex;
        /*align-items:center;*/
        /*margin-bottom:20px;*/
        margin-top:10px;
        gap:20px;
    }
      .notificationblurcard{
           display: flex;
           align-items: center;
           justify-content:center;
           height: 100vh;
           width: 100vw;
           position: fixed;
           top: 0;
           left: 0;
           z-index: 9999;
           background-color: rgba(0, 0, 0, 0.5);  
           backdrop-filter: blur(5px);  
     }
        .compiler-notificationCard {
           display: none;
           width: 90%;
           height: 620px;
           /*overflow: scroll;*/
           /*overflow-y: scroll;*/
           /*overflow-x: hidden;*/
           background: rgb(245, 245, 245);
           display: flex;
           flex-direction: column;
           padding: 15px 21px;
           gap: 10px;
           box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.123);
           border-radius: 20px;
          
       }
       ul{
            list-style:none;
       }
       .youzify-friends-list{
           height:450px;
           overflow:scroll;
           overflow-x:hidden;
           overflow-y:scroll;
       }
             /*compiler share button css*/
              
        .compiler_btn_wrap {
            margin-right: 20px;
            position: relative;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
                -ms-flex-pack: center;
                    justify-content: center;
            -webkit-box-align: center;
                -ms-flex-align: center;
                    align-items: center;
            overflow: hidden;
            cursor: pointer;
            width: 140px;
            height: 50px;
            background-color: #EEEEED;
            border-radius: 80px;
            padding: 0 18px;
            will-change: transform;
            -webkit-transition: all .2s ease-in-out;
            transition: all .2s ease-in-out;
        }
        
        .btn_wrap:hover {
            transition-delay: .4s;
            -webkit-transform: scale(1.1);
                    transform: scale(1.1)
        }
        
        #share_span {
            position: absolute;
            z-index: 99;
            width: 145px;
            height: 50px;
            border-radius: 50px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 20px;
            text-align: center;
            line-height: 50px;
            letter-spacing: 2px;
            color: #EEEEED;
            background-color: #1F1E1E;
            padding: 0 18px;
            -webkit-transition: all 1.2s ease;
            transition: all 1.2s ease;
        }
        
        .compiler_share_container {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-pack: distribute;
                justify-content: space-around;
            -webkit-box-align: center;
                -ms-flex-align: center;
                    align-items: center;
            width: 140px;
            height: 50px;
            font-size: 10px;
            border-radius: 80px;
        }
         
        .compiler_btn_wrap:hover span {
            -webkit-transition-delay: .25s;
                    transition-delay: .25s;
            -webkit-transform: translateX(-280px);
                    transform: translateX(-280px)
        }
        #sloved_profile_pic{
            height:50px;
            width:50px;
            border-radius:50px;
        }
       
        #solved_lenght_of_div{
            display:flex;
            max-width:300px;
            overflow:scroll;
            overflow-y:hidden;
            overflow-x:scroll;
            gap:10px;
        }
        #solved_lenght_of_div::-webkit-scrollbar{
            display:none;
        }
        #no_sloved_profile{
            display:flex;
            height:50px;
            align-items:center;
        }
       .tooltip-contain {
   --background: linear-gradient(45deg, #22d3ee, #1f9df5);
   position: relative;
   margin-left:6px;
   cursor: pointer;
   transition: all 0.2s;
   
   border-radius: 25px;
   color: #fff; 
}

.toolt {
   position: absolute;
   left: 50%;
   transform-origin: bottom;
   opacity: 0;
   pointer-events: none;
   background: var(--background);
   border-radius: 4px;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolt::before {
 position: absolute;
 content: "";
 height: 0.6em;
 width: 0.6em;
 bottom: -0.2em;
 left: 50%;
 transform: translate(-50%) rotate(45deg);
 background: var(--background);
}

.tooltip-contain:hover .toolt {
    top:-3;
  left: 25px;
    width: 100%;
   opacity: 1;
   visibility: visible;
   pointer-events: auto;
   transform: translateX(-50%) scale(1);
}
.tooltip-contain:hover {
 transform: scale(0.9);
}

.avatar-carousel {
    position: relative;
    width: 300px;
    margin-right: 20px;
}

.avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-container {
    display: flex;
    gap: 10px;
    overflow: hidden;
    scroll-behavior: smooth;
    width: 250px;
}

.avatar-item {
    flex: 0 0 auto;
    position: relative;
    display: inline-block;
    cursor: pointer;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #0073E6;
    transition: transform 0.2s;
}

.nav-btn {
    background: #0073E6;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.3s;
}

.nav-btn:hover {
    background: #005bb7;
}

.nav-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background-color: #333;
    color: white;
    font-size: 14px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    margin-bottom: 5px; /* Space between tooltip and avatar */
}

/* Add arrow to tooltip */
.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
}

.avatar-item:hover .tooltip {
    opacity: 1;
    visibility: visible;
}

.avatar-item:hover .avatar {
    transform: scale(1.05);
}

        </style>
        </head>
    <body>
        <div id="iframeeambed">
            <div class="language-choice">
                <div class="blank"></div>
                <div class="compilerButtons">
                    <div class="languageSelection">
                        <select id="language" class="form-select">
                            <option >Program Language</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="python3">Python3</option>
                            <option value="c">C</option>
                        </select>
                    </div>
                    <div class="RunSubmit">
                        <button type="button" class="animation" onclick="goBackward()"><i class="fa-solid fa-chevron-left"></i> Previous</button>
                        <button id="compile" class="animation" type="button" onclick="runTestCases()"><i class="fa-solid fa-play"  style="color:lime"></i></button>
                        <button type="button" class="animation" onclick="goForward()">Next <i class="fa-solid fa-chevron-right"></i></button>
                        
                        <button type="button" class="animation resetbutton" onclick="resetCode()"><i class="fa-solid fa-arrows-rotate"></i> Reset</button>
                        <button type="button" class="animation submitbutton" id="subbutton">Submit</button>
                        
                    </div>
                </div>
            </div>
            <div class="question-and-codeEditor">
                <div class="question">
                    <?php 
                        $url_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
                        
                        $question_id = ($url_id);
                        $table_relationship_table = $wpdb->prefix .'problem_basecode_relationship';
                        $query = $wpdb->prepare("SELECT * FROM $table_relationship_table WHERE problem_id=%d", $question_id);
                        $result_relationship_table = $wpdb->get_row($query);

                        if($result_relationship_table){
                            $table_base_code = $wpdb->prefix ."base_code";
                            $query_base_code = $wpdb->prepare("SELECT * FROM $table_base_code WHERE id=%d", $result_relationship_table->base_code_id);
                            $result_basecode_table = $wpdb->get_row($query_base_code);
                        }
                        if ($question_id > 0) {
                            global $wpdb;
                            $table_name = $wpdb->prefix . 'custom_problems'; // Replace with your actual table name
                            $query = $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $question_id);
                            $question = $wpdb->get_row($query);

                            // Display the question
                            if ($question) {
                                ?>
                                <!--<strong><p class="tent"></?php echo $question->id ?>.</?php echo $question->description ?></p></strong>-->
                             <div class="compiler_quesrion_container">
                                <div class="tent">
                                   <h2 class="compiler_h2_tags_problem">Problem Statement:</h2>
                                    <p class="compiler_problem_p_tags" id="problem_statement"><?php echo $question->problem_statement ?></p>
                                </div>
                                
                                <div class="tent">
                                    <h2 class="compiler_h2_tags_problem">Constraints:</h2>
                                     <p class="compiler_problem_p_tags"><?php echo $question->constraints ?></p>
                                </div>
                                
                                <div class="tent">
                                   <h2 class="compiler_h2_tags_problem">Description:</h2>
                                     <p class="compiler_problem_p_tags"><?php echo $question->description ?></p>
                                </div>
                            </div>
                                                                <?php
                                    $test_cases = json_decode($question->test_cases_json);
                                    
                                    $input_formats = array();
                                    $output_formats = array();
                                    
                                    ?>
                                    <hr>
                                    <!--<p class="tent"><b>Test Cases</b></p>-->
                                    <h2 class="compiler_h2_tags_problem" style="margin-left: 15px;">Test Cases </h2>
                                    <?php
                                    foreach ($test_cases as $test_case) {
                                        if ($test_case->hidden === 'false') {
                                            $input = $test_case->input;
                                            $output = $test_case->output;
                                            ?>
                                            <div class="container">
                                                <div class="tent">
                                                    <p class="compiler_input_p_tags">Input : <?php echo $input; ?></p>
                                                </div>
                                                
                                                <div class="tent">
                                                    <p class="compiler_input_p_tags">Output : <?php echo $output; ?></p>
                                                </div>
                                                
                                                <div class="separator">
                                                    <hr>
                                                </div>
                                            </div>
                                            <?php
                                        }
                                    }
                                ?>

                                <?php
                            } else {
                                echo '<p>Question not found</p>';
                            }
                        } else {
                            echo '<p>Invalid question ID</p>';
                        }
                    ?>
                </div>
                <div class="code-editor">
                     
                    <textarea type="text" id="editor" class="control"></textarea>
                    <div id="mobile-mode-display-buttons">
                    <button type="button" id="mobileresetbutton" class="animation " onclick="resetCode()"><i class="fa-solid fa-arrows-rotate"></i> Reset</button>
                    <button type="button" id="mobilesubmitbutton" class="animation submitbutton " id="subbutton" >Submit</button>
                    </div>
                <div class="notificationblurcard" style="display:none" id="notificationblurcard" > 
                <div id="leftside-div" style="height: 100vh;width: 100%;"></div>
                   <div class="compiler-notificationCard">
                   <input type="text" name="searchFriends" id="friendsName" placeholder="Search friends...">
                   <?php
                   if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['selected_friends'])) {
                       $selected_friends = $_POST['selected_friends'];
                       $selected_friends = array_map('intval', $selected_friends);
                   }
                
                   if (!is_user_logged_in()) {
                       echo '<p>You must be logged in to see your friends.</p>';
                   } else {
                       if (function_exists('bp_is_active') && bp_is_active('friends')) {
                           $current_user_id = get_current_user_id();
                           $friends = friends_get_friend_user_ids($current_user_id);
                           if (!empty($friends)) {
                               ?>
                               <form id="friends-form" method="post" action="">
                                   <ul class="youzify-friends-list">
                                       <?php
                                       foreach ($friends as $friend_id) {
                                           $friend_user = get_userdata($friend_id);
                                           $user_info = get_userdata($friend_id);
                                           $email = $user_info->user_email;
                                           $userName = $user_info->display_name;
                                           $avatar_url = get_avatar_url($friend_id);
                                           ?>
                                           <li style="margin-top: 10px;background-color: #c5c5c5;margin-left: -30px;" class="user_list">
                                               <label style="display:flex;align-items: center;justify-content: space-between;">
                                                   <input type="checkbox" name="selected_friends[]" value="<?php echo $friend_id ?>" data-name="<?php echo $friend_user->display_name ?>">
                                                   <div class="friends_name_in_search"><?php echo $friend_user->display_name ?></div>
                                                   <img src="<?php echo $avatar_url ?>" alt="<?php echo $friend_user->display_name ?>" style="height: 50px; width: 50px;">
                                               </label>
                                           </li>
                                           <?php
                                       }
                                       ?>
                                   </ul>
                                   <input type="hidden" name="question_id" value="<?php echo $question_id ?>">
                                   <input type="submit" class="share_task" name="shared_friends" id="share-todo" value="Submit">
                               </form>
                               <?php
                           } else {
                               echo '<p>No friends found.</p>';
                           }
                       } else {
                           echo '<p>BuddyPress or Youzify is not active.</p>';
                       }
                   }
                   ?>
                   </div>
                   <div id="rightside_div" style="height: 100vh;width: 100%;"></div>

                </div>
                <div id="compiler_challenge_friend">
                    <div id="solved_lenght_of_div" class="avatar-carousel">
                        <?php
                        global $wpdb;
                        
                        $current_user_id = get_current_user_id();
                        $friends = friends_get_friend_user_ids($current_user_id);
                        $current_question_id = $question_id;  
                        
                        $table_name = $wpdb->prefix . 'user_problem_status';
                        $users_table = $wpdb->prefix . 'users';
                        
                        $query = $wpdb->prepare("
                            SELECT u.ID, u.display_name, u.user_email, u.user_nicename, u.user_login, u.user_url, u.user_registered,
                                   u.user_status, u.display_name, um.meta_value as avatar
                            FROM $wpdb->users u
                            INNER JOIN $table_name ups ON u.ID = ups.user_id
                            LEFT JOIN $wpdb->usermeta um ON u.ID = um.user_id AND um.meta_key = 'avatar_field'
                            WHERE ups.solve_status = 'solved'
                            AND ups.problem_id = %d
                            AND ups.user_id IN (" . implode(',', array_map('intval', $friends)) . ")
                            LIMIT 10
                        ", $current_question_id);

                        $results = $wpdb->get_results($query);
                        
                        if ($results) {
                            echo '<div class="avatar-wrapper">';
                            echo '<button class="nav-btn prev-btn"><i class="fas fa-chevron-left"></i></button>';
                            echo '<div class="avatar-container">';
                            foreach ($results as $result) {
                                $user_avatar = $result->avatar ? $result->avatar : get_avatar_url($result->ID);
                                $user_name = $result->display_name;
                                echo '<div class="avatar-item">';
                                echo '<div class="tooltip">' . esc_html($user_name) . '</div>';  // Moved tooltip before image
                                echo '<img class="avatar" src="' . esc_url($user_avatar) . '" alt="' . esc_attr($user_name) . '">';
                                echo '</div>';
                            }
                            echo '</div>';
                            echo '<button class="nav-btn next-btn"><i class="fas fa-chevron-right"></i></button>';
                            echo '</div>';
                        } else {
                            echo '<div id="no_solved_profile">No friends have solved this problem yet.</div>';
                        }
                        ?>
                    </div>
                    <div class="compiler_btn_wrap">
                        <span id="share_span">Challenge</span>
                        <div class="compiler_share_container">
                          Challenge Your Friends
                        </div>
                    </div>
                </div>
                   
                </div>
            </div>
             <div id="testResults"></div>
            <!-- </div> -->
            <script>
    jQuery(document).ready(function($) {
            $('#share-todo').on('click', function(e) {
                   e.preventDefault();
                   const question_id =$('input[name="question_id"]').val() ;
                    var currentPageUrl = window.location.href;
                    const problem_name =  $('#problem_statement').text().trim();
    
                     const selectedFriends = $('input[name="selected_friends[]"]:checked').map(function() {
                       return {
                           id: $(this).val(),
                           name: $(this).data('name')
                       };
                   }).get();
                  console.log(selectedFriends);
                  console.log(problem_name); 
                   $.each(selectedFriends, function(index, friend) {
                      $.ajax({
                              type: 'POST',
                              url: '<?php echo admin_url('admin-ajax.php')?>',
                              data: {
                                  action: 'add_challenge_problem',
                                  question_id:question_id,
                                  friend_id: friend.id,
                                  page_url: currentPageUrl,
                                  problem_name:problem_name
                              },
                               success: function(response) {
                                    console.log( response);
                                },
                                error: function(xhr, status, error) {
                                    console.error('Error:', error);
                                }   
                         });
                    });
            });
    });
    jQuery(document).ready(function($) {
           $(document).off('click', '.compiler_btn_wrap').on('click', '.compiler_btn_wrap', function(e) {
               $('.notificationblurcard').show();
              
           });
    });
    jQuery(document).ready(function($) {
        
      $('#rightside_div').click(function(e){
          $('#notificationblurcard').hide();
      });
      $('#leftside-div').click(function(e){
          $('#notificationblurcard').hide();
      });
           $('#friendsName').on('keyup', function() {
               var input = $(this).val().toLowerCase();
               $('.youzify-friends-list .user_list').each(function() {
                   var name = $(this).find('div').text().toLowerCase();
                   if (name.includes(input)) {
                       $(this).show();
                   } else {
                       $(this).hide();
                   }
               });
           });
    });
    const disabledKeys = ["c", "C", "x", "x", "v","V", "J", "j", "u","U",  "i", "I"]; // keys that will be disabled

      const showAlert = e => {
        e.preventDefault();  
        return alert("Sorry, you can't view or copy source codes this way!");
      }

      document.addEventListener("contextmenu", e => {
        showAlert(e);  
      });

      document.addEventListener("keydown", e => {
        
        if((e.ctrlKey && disabledKeys.includes(e.key)) || e.key === "F12") {
          showAlert(e);
        }
      });
        var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
            mode: "text/x-c++src",
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true
        });
        function updateEditorSize() {
            var width = window.innerWidth;
            var editorWidth;
            if (width >= 1200) {

                editorWidth = 0.6 * width;
            } else if (width >= 768) {

                editorWidth = 0.8 * width;
            } else {

                editorWidth = 0.95 * width;
            }

            editor.setSize(editorWidth, "500");
        }
        updateEditorSize();
        window.addEventListener('resize', updateEditorSize);

      
        
        var option = document.getElementById("language");
        
          option.addEventListener("change",function(){
          var result = confirm("Your current code will be erased due to a change in language. Do you want to proceed?");
            if (result) {
                if(option.value=="java"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_java);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;
                    editor.setOption("mode","text/x-java");
                    editor.setValue(javascriptVariable);
                }else if(option.value=="python3"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_python3);}else{
                            echo json_encode("#please write your code");
                        } 
                        ?>;
                    editor.setOption("text/x-python");
                    editor.setValue(javascriptVariable);
                }else if(option.value=="cpp"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_cplusplus);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;
                    editor.setOption("mode","text/x-c++src");
                    editor.setValue(javascriptVariable)
                }else{
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_c);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;
                    editor.setOption("mode","text/x-csrc");
                    editor.setValue(javascriptVariable)
            }
    
        } else {
            // Code to execute if Cancel is clicked
            console.log("User clicked Cancel");
        }
        
        })  
        
        function goBackward() {
            var currentId = parseInt(new URLSearchParams(window.location.search).get('id'));
            var newId = Math.max(1, currentId - 1);
            window.location.href = "<?php echo home_url() ?>/custom-problems/?id=" + newId;
        }

        function goForward() {
            var currentId = parseInt(new URLSearchParams(window.location.search).get('id'));
            var newId = currentId + 1; // Assuming there is no maximum limit specified
            window.location.href = "<?php echo home_url() ?>/custom-problems/?id=" + newId;
        }
        
function runTestCases() {
    var content = editor.getValue();
    var option = document.getElementById("language");
    var languageCode = option.value;

    var invisible_cpp = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_cplusplus : "empty"); ?>;
    var invisible_c = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_c : "empty"); ?>;
    var invisible_python3 = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_python3 : "empty"); ?>;
    var invisible_java = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_java : "empty"); ?>;

    var wordToReplace = "@#hysterchatusedforvisibleinsertion";
    var replacementWord = content;
    var receivedOutput = content;

    if (languageCode == "cpp" && invisible_cpp != "empty") {
        receivedOutput = invisible_cpp.replace(wordToReplace, replacementWord);
    } else if (languageCode == "c" && invisible_c != "empty") {
        receivedOutput = invisible_c.replace(wordToReplace, replacementWord);
    } else if (languageCode == "python3" && invisible_python3 != "empty") {
        receivedOutput = invisible_python3.replace(wordToReplace, replacementWord);
    } else if (languageCode == "java" && invisible_java != "empty") {
        receivedOutput = invisible_java.replace(wordToReplace, replacementWord);
    }

    var testCases = <?php echo $question->test_cases_json; ?>;
    var allPassed = true;

    document.getElementById("testResults").innerHTML = "";

    var filteredTestCases = testCases.filter(function(testCase) {
        return testCase.hidden !== 'true';
    });

    var index = 0;
    function runNextTestCase() {
        if (index < filteredTestCases.length) {
            var testCase = filteredTestCases[index];

            var data = {
                "language": languageCode,
                "code": receivedOutput,
                "input": testCase.input
            };
            console.log("Sending data:", data);

            fetch("?action=execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({data})
            })
            .then(response => {
                if (!response.ok) {
                return response.text().then(errorMessage => {
                    throw new Error(`Error ${response.status}: ${errorMessage}`);
                });
             }
               return response.json();
            })
            .then(data => {
                console.log("Received data:", data);
                var receivedOutput = data.output;
                var expectedOutput = testCase.output;
                var insertedInput = testCase.input;

                var testResult = document.createElement("div");
                const isOutputCorrect = receivedOutput === expectedOutput;
                testResult.innerHTML = `
                    <div style="margin-top: 15px; border-radius: 15px; overflow: hidden; box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.5); background-color: #ffffff; font-family: 'Arial', sans-serif;">
                        <div style="border: 2px solid ${isOutputCorrect ? 'green' : 'red'}; border-radius: 15px;">
                            <div style="background-color: ${isOutputCorrect ? 'green' : 'red'}; color: white; padding: 0px; text-align: center;">
                                <h2 style="margin: 0; font-size: 24px;">Test Case</h2>
                            </div>
                            <div style="padding: 10px;">
                                <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Input:</p>
                                <span style="display: inline-block; padding: 12px;"><b>${insertedInput}</b></span>
                    
                                <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Received Output:</p>
                                <span style="display: inline-block; padding: 12px; color: ${isOutputCorrect ? 'green' : 'red'};"><b>${receivedOutput}</b></span>
                    
                                <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Expected Output:</p>
                                <span style="display: inline-block; padding: 12px;"><b>${expectedOutput}</b></span>
                            </div>
                        </div>
                    </div>
                `;

                document.getElementById("testResults").appendChild(testResult);
               
                if (receivedOutput !== expectedOutput) {
                    allPassed = false;
                }
                testResult.querySelector("div").style.border = `1px solid ${allPassed ? '#4CAF50' : '#F44336'}`;
    
                var tickMark = document.createElement("div");
                tickMark.style.color = allPassed ? "green" : "red";
                document.getElementById("testResults").appendChild(tickMark);
            })
            .catch(error => {
                console.error('Error:', error);
                allPassed = false;

                var errorMessage = document.createElement("div");
                errorMessage.textContent = "Error: " + error.message;
                errorMessage.style.color = "red";
                document.getElementById("testResults").appendChild(errorMessage);
            })
            .finally(() => {
                index++;
                runNextTestCase();
            });
        } else {
            var summary = document.createElement("div");
            summary.textContent = allPassed ? "Congratulations! All test cases passed!" : "Some test cases failed.";
            summary.style.color = allPassed ? "#55a630" : "red";
            summary.style.marginLeft = "20px";  
            summary.style.fontSize = "xx-large";  
            summary.style.marginTop = "10px"; 
            document.getElementById("testResults").appendChild(summary);
        }
    }
    runNextTestCase();
}            
           var testInput;
           var testOutput;
           var check=false;
document.addEventListener("DOMContentLoaded", function() {
      var attemptTimes = 0;
    function runAllTestCases() {
        attemptTimes++;
        var content = editor.getValue();
        var invisible_cpp = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_cplusplus : "empty"); ?>;
        var invisible_c = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_c : "empty"); ?>;
        var invisible_python3 = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_python3 : "empty"); ?>;
        var invisible_java = <?php echo json_encode($result_relationship_table ? $result_basecode_table->in_java : "empty"); ?>;

        var wordToReplace = "@#hysterchatusedforvisibleinsertion";
        var replacementWord = content;
        var receivedOutput = content;

        var option = document.getElementById("language");
        if (!option) {
            console.error("Element with ID 'language' not found.");
            return;
        }

        switch (option.value) {
            case "cpp":
                if (invisible_cpp !== "empty") receivedOutput = invisible_cpp.replace(wordToReplace, replacementWord);
                break;
            case "c":
                if (invisible_c !== "empty") receivedOutput = invisible_c.replace(wordToReplace, replacementWord);
                break;
            case "python3":
                if (invisible_python3 !== "empty") receivedOutput = invisible_python3.replace(wordToReplace, replacementWord);
                break;
            case "java":
                if (invisible_java !== "empty") receivedOutput = invisible_java.replace(wordToReplace, replacementWord);
                break;
        }
        var testCases = <?php echo $question->test_cases_json; ?>;
        var allPassed = true;
        var languageCode = option.value;
      console.log(languageCode);
        var passedTestCases = 0;

        document.getElementById("testResults").innerHTML = "";

        var index = 0;
        function runNextTestCase() {
            if (index < testCases.length) {

                var testCase = testCases[index];

                var data = {
                    "language": option.value,
                    "code": receivedOutput,
                    "input": testCase.input
                };
                console.log(data);
                console.log(data);
                        fetch("?action=execute", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ data })
                            })
                        .then(response => response.json())
                            .then(data => {
                            var receivedOutput = data.output;
                            var expectedOutput = testCase.output;
                            var insertedInput = testCase.input;
                            var hidden = testCase.hidden;
                            console.log(receivedOutput);
                            console.log(testOutput);
                            console.log(testOutput);
                            console.log("Request ID:", data.requestId); 
                            testInput = testInput;
                            testOutput = expectedOutput;
                            var testResult = document.createElement("div");
                         const isOutputCorrect = receivedOutput === expectedOutput;
                             if (!isOutputCorrect) {
                                allPassed = false;
                            } else {
                                passedTestCases++;
                            }

                            testResult.innerHTML = `
                                <div style="margin-top: 15px; border-radius: 15px; overflow: hidden; box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.5); background-color: #ffffff; font-family: 'Arial', sans-serif;">
                                    <div style="border: 2px solid ${isOutputCorrect ? 'green' : 'red'}; border-radius: 15px;">
                                        <div style="background-color: ${isOutputCorrect ? 'green' : 'red'}; color: white; padding: 5px; text-align: center;">
                                            <h2 style="margin: 0; font-size: 24px;">Test Case ${index + 1}</h2>
                                        </div>
                                        <div style="padding: 10px;">
                                            <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Input:</p>
                                            <span style="display: inline-block; padding: 12px;"><b>Hidden</b></span>
                                            <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Received Output:</p>
                                            <span style="display: inline-block; padding: 12px; color: ${isOutputCorrect ? 'green' : 'red'};"><b>Hidden</b></span>
                                            <p style="margin-bottom: 0.2px; font-size: 18px; color: #2c3e50;">Expected Output:</p>
                                            <span style="display: inline-block; padding: 12px;"><b>Hidden</b></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                                testResult.style.marginBottom = "10px";
                                testResult.style.padding = "10px";
                                testResult.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                testResult.style.borderRadius = '5px';
                                document.getElementById("testResults").appendChild(testResult);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        allPassed = false;
                    })
                    .finally(() => {
                        index++;
                        runNextTestCase();
                    });
            } else {
                var summary = document.createElement("div");
                summary.textContent = allPassed ? "Congratulations! All test cases passed!" : "Some test cases failed.";
                summary.style.color = allPassed ? "#55a630" : "red";
                document.getElementById("testResults").appendChild(summary);
                if (allPassed) {
                    var xhr = new XMLHttpRequest();
                    var requestData = {
                        user_id: <?php echo $current_user_id; ?>,
                        problem_id: <?php echo $question->id; ?>,
                        solve_status: "solved",
                        points: <?php echo $question->points; ?>,
                        attempt_times: attemptTimes,
                        solved_language: languageCode,
                        test_cases: testCases.length
                    };

                    xhr.open("POST", "<?php echo site_url('/update-solve-status/'); ?>", true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                try {
                                    var response = JSON.parse(xhr.responseText.trim());
                                    if (response.success) {
                                        var status = document.createElement("div");
                                        status.textContent = "Great! You have solved it.";
                                        status.style.color = "#55a630";
                                        document.getElementById("testResults").appendChild(status);
                                        var celebrationPopup = document.getElementById("celebrationPopup");
                                        celebrationPopup.style.display = allPassed ? "flex" : "none";
                                        celebrationPopup.style.width = "100%";
                                    } else {
                                        console.error("Failed to update status. Server response:", response);
                                    }
                                } catch (error) {
                                    console.error("Error parsing JSON response:", error);
                                }
                            } else {
                                console.error("Failed to update status. Status code:", xhr.status);
                            }
                        }
                    };

                    xhr.send(JSON.stringify(requestData));
                } else {
                    console.log('Not all test cases passed');
                     var xhr = new XMLHttpRequest();
                        var requestData = {
                        user_id: <?php echo $current_user_id; ?>,
                        problem_id: <?php echo $question->id; ?>,
                        solve_status: "solve",
                        attempt_times: attemptTimes,
                        solved_language: languageCode,
                        test_cases: passedTestCases.length
                    };

                    xhr.open("POST", "<?php echo site_url('/update-solve-status/'); ?>", true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                try {
                                    var response = JSON.parse(xhr.responseText.trim());
                                    if (response.success) {
                                        
                                        var status = document.createElement("div");
                                        status.textContent = "Good!  Atleast You  Try it.";
                                        status.style.color = "#FFC100";
                                        document.getElementById("testResults").appendChild(status);
                                        
                                    } else {
                                        console.error("Failed to update status. Server response:", response);
                                    }
                                } catch (error) {
                                    console.error("Error parsing JSON response:", error);
                                }
                            } else {
                                console.error("Failed to update status. Status code:", xhr.status);
                            }
                        }
                    };

                    xhr.send(JSON.stringify(requestData));
                }
            }
        }

        runNextTestCase();
    }

    var buttons = document.querySelectorAll(".submitbutton");
    buttons.forEach(function(button) {
        button.addEventListener("click", runAllTestCases);
    });
});
    </script>
             <div id="celebrationPopup" class="selebration_div" style="display: none;">
            <div class="wallet" id="wallet">
              <div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="24" height="24" viewBox="0 0 458.5 458.5" fill="currentColor"><path d="M336.7 344c-22 0-39.9-18-39.9-39.9V238c0-22 18-39.8 39.9-39.8h105.7v-65.9c0-17-13.8-30.7-30.7-30.7h-381c-17 0-30.7 13.7-30.7 30.7v277.6c0 17 13.8 30.8 30.7 30.8h381c17 0 30.7-13.8 30.7-30.8V344H336.7z"/><path d="M440.5 220H336.7c-10 0-18 8-18 18V304c0 10 8 18 18 18h103.8c10 0 18-8 18-18V238c0-10-8-18-18-18zm-68 77a26 26 0 1 1 0-52 26 26 0 0 1 0 52zM358.2 45.2A39.7 39.7 0 0 0 308 20L152 71.6h214.9l-8.7-26.4z"/></svg>
              </div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(-100px + 24px); --coin-to-y: calc(-105px + 24px); --coin-delay: 0.3s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(-70px + 24px); --coin-to-y: -90px; --coin-delay: 0.1s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(-30px + 24px); --coin-to-y: -125px; --coin-delay: 0s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(10px + 24px); --coin-to-y: -130px; --coin-delay: 0.2s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(30px + 24px); --coin-to-y: -100px; --coin-delay: 0.1s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(70px + 24px); --coin-to-y: -95px; --coin-delay: 0.4s;"
              ></div>
              <div
                class="coin coin--animated"
                style="--coin-to-x: calc(100px + 24px); --coin-to-y: -100px; --coin-delay: 0.2s;"
              ></div>
            </div>
          </div>
            <style>
 

.selebration_div {
  
  display: flex;
  justify-content: center;
  align-items:center;

}

.wallet {
  width: 64px;
  height: 64px;
  position: relative;
}

.icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #0066ff;
  color: #fff;
  position: relative;
  z-index: 101;
}

.coin {
  position: absolute;
  top: var(--coin-from-x, 24px);
  left: var(--coin-from-y, 24px);
  z-index: 100;
  opacity: 0;
}

.coin::after {
  content: "$";
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  font-size: 10px;
  color: rgb(237, 196, 107);
  background: rgb(227, 162, 23);
  border: 2px solid rgb(237, 196, 107);
  border-radius: 50%;
  opacity: 0;
}

.coin--animated,
.coin--animated::after {
  animation-delay: var(--coin-delay, 0s);
  animation-duration: var(--coin-duration, 1.5s);
  animation-direction: normal;
  animation-fill-mode: both;
  animation-play-state: running;
  animation-iteration-count: infinite;
}

.coin--animated {
  animation-name: coin-x-axis;
  animation-timing-function: ease-in;
}

.coin--animated::after {
  animation-name: coin-y-axis-and-flip;
  animation-timing-function: ease-out;
}

@keyframes coin-x-axis {
  30% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  to {
    left: calc(var(--coin-to-x) * 1.5);
  }
}

@keyframes coin-y-axis-and-flip {
  30% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  to {
    transform: translateY(calc(var(--coin-to-y) * 1.5)) rotate3d(1, 1, 1, 1080deg);
  }
}

  </style>
            <script>
            function openTestCase(){
                if(check === false){
                    var unlock = document.createElement("div");
                    
                    unlock.innerHTML += "<span> unlocked</span>"
                    unlock.innerHTML +="<p>"+"Input:" + "<span style='background-color:#E7EEEF'>" +"<b>"+ testInput +"</b>"+"</span>" +"</p>"  +
                                        "<p>"+"Expected Output:" + "<span style='background-color:#E7EEEF'>" +"<b>"+ testOutput +"</b>"+ "</span>" +"</p>" ;
                                unlock.style.padding = "10px"; // Add padding
                                unlock.style.border = "1px solid #ccc"; // Add border
                                unlock.style.borderRadius = "5px"; // Add border radius
                                unlock.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                unlock.style.marginBottom = "5px"; // Add margin-bottom
                                        
                    document.getElementById("testResults").appendChild(unlock);
                    check = true;
                }
            }
             
            function resetCode(){
                var option = document.getElementById("language");
                if(option.value=="java"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_java);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;
                }else if(option.value=="python3"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_python3);}else{
                            echo json_encode("#please write your code");
                        } 
                        ?>;
                }else if(option.value=="cpp"){
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_cplusplus);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;
                }else{
                    var javascriptVariable = <?php 
                        if($result_relationship_table){ echo json_encode($result_basecode_table->v_c);}else{
                            echo json_encode("//please write your code");
                        } 
                        ?>;    
                }
                editor.setValue(javascriptVariable);
            }
        </script>
        </div>
    </body>
        </html>
<?php
get_footer();
