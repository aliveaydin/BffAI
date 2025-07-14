const sendRequest = require('../utils/sendRequest');

const checkUserAuthority = async({
    email,
    userId,
    projectId,
    token,
    roleId

}) => {
    try {

        if (!email) {
            return false;
        }
        const url = process.env.MINDBRICKS_URL+"project/projectmembers?projectId="+projectId;

        const response = await sendRequest({
            url,
            method: 'GET',
            token,
            projectId
        });


        if(response.status!="OK") {
            throw new Error("Error in checkUserAuthority");
        }

        const members = response.projectMembers.filter(member => member.roleId <= 6);

        isUserMemberOfProject = members.some(member => {
            return member?.email?.toString().replace(/-/g, "") == email.toString().replace(/-/g, "")
        });

        return isUserMemberOfProject;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = checkUserAuthority;