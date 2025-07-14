const { search } = require("./elasticsearch");

const getProjectMembersFromElastic = async (projectId) => {
    try {
        const searchQuery = {
            query: {
                term: {
                    projectId: projectId
                }
            }
        };

        const result = await search("mindbricks_projectmember", searchQuery);

        let allDocs = result?.hits?.hits.map((hit) => hit._source) || [];
        return allDocs;
    } catch (error) {
        console.error("getProjectMembersFromElastic error =>", error);
        throw error;
    }
};

module.exports = getProjectMembersFromElastic;