// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


// Declare Variables for Timeline
var current_role_of_workflow_action = "";
var status_of_before_workflow_action = "";
var action_of_workflow = "";
var modified_of_before_workflow_action = "";
var current_user_of_workflow_action = "";
var status_of_after_workflow_action = "";
var modified_of_after_workflow_action = "";


frappe.ui.form.on("Withdrawal Request", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
            frm.page.btn_secondary.hide(); // hidden Cancel Button
        }, 500);

        $(frm.fields_dict["timeline_html"].wrapper).html("");
        frm.set_df_property("timeline_section", "hidden", true);            

        if (frappe.user.has_role('Finance Officer'))
        frm.set_df_property('financial_status', 'read_only', false);


        if (!frm.is_new()) {
            // if (frappe.user_roles.includes("Student")) {
            //     setTimeout(() => {
            //         var fees_status = frm.doc.fees_status;
            //         if (fees_status === "Not Paid") {
            //             frm.add_custom_button(__("Get Code for Fee Payment"), () => {
            //                 frappe.msgprint(__("Payment code for '") + frm.doc.name + __("' is: #########"));
            //             });
            //         }
            //     }, 500);
            // }

            psa_utils.format_timeline_html(frm, "timeline_html", frm.doc.timeline_child_table);

            if (frm.doc.fees_status == "Not Paid") {
                frm.set_intro((__(`You have to pay fees of request before confirm it!`)), 'red');
            }

            if (frm.doc.docstatus == 0) {
                frm.set_df_property("request_attachment", "reqd", 1);
            }
            else {
                frm.set_df_property("request_attachment", "reqd", 0);
            }

            if (frm.doc.docstatus == 0) {
                frm.set_df_property("library_eviction", "reqd", 1);
            }
            else {
                frm.set_df_property("library_eviction", "reqd", 0);
            }

            frm.set_df_property("attachment_section", "hidden", false);
            if (frm.doc.request_attachment) {
                frm.set_df_property("request_attachment", "description", "");
            }
            else {
                frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
            }

            if (frm.doc.library_eviction) {
                frm.set_df_property("library_eviction", "description", "");
            }
            else {
                frm.set_df_property("library_eviction", "description", __("You can attach only pdf file"));
            }

            var creation_date = frm.doc.creation;
            var formatted_creation_date = creation_date.split(" ")[0] + " " + (creation_date.split(" ")[1]).split(".")[0];

            var modified_date = frm.doc.modified;
            var formatted_modified_date = modified_date.split(" ")[0] + " " + (modified_date.split(" ")[1]).split(".")[0];

            psa_utils.format_single_html_field(frm, "request_date_html", __('Request Date'), formatted_creation_date);

            if (frm.doc.status.includes("Delivered by")) {
                psa_utils.format_single_html_field(frm, "modified_request_date_html", __('File Delivery Date'), formatted_modified_date);
            }
            else if (frm.doc.status.includes("Rejected by")) {
                psa_utils.format_single_html_field(frm, "modified_request_date_html", __('Rejection Date'), formatted_modified_date);
            }
            else {
                $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
            }
        }
        else {
            $(frm.fields_dict["request_date_html"].wrapper).html('');
            $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
        }

        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, creation, student, program) {
                var year_of_enrollment = new Date(creation).getFullYear();
                psa_utils.get_psa_student(student, function (full_name_arabic, full_name_english) {
                    psa_utils.get_program(program, function (college, department, specialization) {
                        var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                        var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                        psa_utils.format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                        var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                        var array_of_value = [college, department, specialization, status];
                        psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                    });
                });
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
        }
    },

    onload(frm) {
        // Uncomment it
        // if (frm.is_new()) {
        //     psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment");
        // }
    },

    before_workflow_action(frm) {
        status_of_before_workflow_action = frm.doc.status;
        action_of_workflow = frm.selected_workflow_action;
        modified_of_before_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];
    },

    after_workflow_action(frm) {
        current_user_of_workflow_action = frappe.session.user_fullname;
        status_of_after_workflow_action = frm.doc.status;
        modified_of_after_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];

        psa_utils.get_current_workflow_role(
            "Withdrawal Request Workflow",
            status_of_before_workflow_action,
            function (current_workflow_role) {
                current_role_of_workflow_action = current_workflow_role;
                psa_utils.insert_new_timeline_child_table(
                    "Withdrawal Request",
                    frm.doc.name,
                    "timeline_child_table",
                    {
                        "position": current_role_of_workflow_action,
                        "full_name": current_user_of_workflow_action,
                        "previous_status": status_of_before_workflow_action,
                        "received_date": modified_of_before_workflow_action,
                        "action": action_of_workflow,
                        "next_status": status_of_after_workflow_action,
                        "action_date": modified_of_after_workflow_action
                    }
                );

                window.location.reload();
            }
        );
    },

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, creation, student, program) {
                var year_of_enrollment = new Date(creation).getFullYear();
                psa_utils.get_psa_student(student, function (full_name_arabic, full_name_english) {
                    psa_utils.get_program(program, function (college, department, specialization) {
                        var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                        var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                        psa_utils.format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                        var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                        var array_of_value = [college, department, specialization, status];
                        psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                    });
                });

                if (status == "Withdrawn") {
                    frm.set_intro((__(`Can't add Withdrawnal request, because current status is ${status}!`)), 'red');
                }

                else {
                    psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                        if (doc) {
                            frm.set_intro('');
                            var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                            frm.set_intro((__(`Can't add a Withdrawal request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                        }
                        else {
                            psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                                if (doc) {
                                    frm.set_intro('');
                                    var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                    frm.set_intro((__(`Can't add a Withdrawal request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                }
                                else {
                                    psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                                        if (doc) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                            frm.set_intro((__(`Can't add a Withdrawal request, because you have an active Withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                        }
                                        else if (status == "Continued" || status == "Suspended") {
                                            frm.set_intro((__(`Current status is ${status}.`)), 'green');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
        }
    },
});
