const changeApproveListDataFormat = (approvedList) => {
    if (approvedList.length == 0) {
        return [];
    }

    const sendData = [
        {
            "name": "documents",
            "data": []
        },
        {
            "name": "microservices",
            "data": []
        }
    ];
    approvedList.forEach((approveData) => {
        if (
            approveData.agent == "project-manager"
            || approveData.agent == "business-analyst"
        ) {
            let name = approveData.agent;
            if (approveData.name == "Project Description And Scope") name = "Project Description And Scope";
            if (approveData.name == "User Stories") name = "User Stories";
            if (approveData.name == "Product Requirements Document") name = "Product Requirements Document";
            if (approveData.name == "Use Cases") name = "Use Cases";

            return sendData[0].data.push({
                projectId: approveData.projectId,
                agent: approveData.agent == "project-manager" ? "product-manager" : approveData.agent,
                name,
                content: approveData.jsonBody,
                status: approveData.isApproved ? "approved" : "defined",
                createdAt: approveData.createdAt,
            });
        }

        if (
            approveData.agent == "software-architect"
        ) {
            JSON.parse(approveData.jsonBody).forEach((item) => {
                const findDesined = approvedList.find((approveDataFind) => {
                    return (
                        approveDataFind.agent == "software-engineer"
                        && approveDataFind.name == item.name
                    );
                });
                let status;
                if (findDesined && findDesined.isApproved) {
                    status = "approved";
                } else if (findDesined && !findDesined.isApproved) {
                    status = "designed";
                } else {
                    status ="defined";
                }

                let newContent = "";
                try {
                    if(findDesined){
                        try {
                            newContent = JSON.parse(findDesined.jsonBody)
                        } catch (error) {
                            newContent=findDesined.jsonBody;
                        }
                    }else{
                        try {
                            newContent = JSON.parse(findDesined.jsonBody)
                        } catch (error) {
                            newContent=JSON.parse(approveData.jsonBody)?.find((itemFind) => itemFind.name == item.name)
                        }
                    }
                } catch (error) {
                    newContent=findDesined
                }
                

                sendData[1].data.push({
                    projectId: approveData.projectId,
                    agent: findDesined ? "software-engineer" : approveData.agent,
                    name: item.name,
                    content: newContent,
                    status,
                    createdAt: approveData.createdAt,
                });

                // if(findDesined) return sendData[1].data.push({
                //     "projectId": approveData.projectId,
                //     agent: findDesined ? "software-engineer" : approveData.agent,
                //     name: item.name + " Rest Api Guide",
                //     "content": "",
                //     status: findDesined ? "designed" : (approveData.isApproved ? "approved" : "defined"),
                //     createdAt: approveData.createdAt,
                // },);
                
            });
        }
    });
    return sendData;
}

module.exports = changeApproveListDataFormat;