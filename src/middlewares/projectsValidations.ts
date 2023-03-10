import { Request, Response, NextFunction } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { IProject } from "../interfaces/projectsInterfaces";

const removeExtraKeysProject = (request: Request, response: Response, next: NextFunction) => {
    let requestBody = request.body
    
    if(request.body.endDate) {
        request.body = {
            name: requestBody.name,
            description: requestBody.description,
            estimatedTime: requestBody.estimatedTime,
            repository: requestBody.repository,
            startDate: requestBody.startDate,
            endDate: requestBody.endDate,
            developerId: requestBody.developerId
        }
    } else {
        request.body = {
            name: requestBody.name,
            description: requestBody.description,
            estimatedTime: requestBody.estimatedTime,
            repository: requestBody.repository,
            startDate: requestBody.startDate,
            developerId: requestBody.developerId
        }
    }   
    
    return next()
}

const checkRequiredKeysProjects = (request: Request, response: Response, next: NextFunction) => {
    const requiredKeys = [
        "name",
        "description",
        "estimatedTime",
        "repository",
        "startDate",
        "developerId"
    ]
    const requestKeys = Object.keys(request.body)

    let hasRequiredKeys = true

    requiredKeys.forEach(key => {
        if(!requestKeys.includes(key)){
            hasRequiredKeys = false;
        }
    })

    if(!hasRequiredKeys) {
        return response.status(400).json({
            message: `Missing required keys: ${requiredKeys}.`
        })
    }

    return next()
}

const checkIfProjectExists = async (request: Request, response: Response, next: NextFunction) => {
    const projectId: any = request.params.id
    
    if(parseInt(projectId) != projectId) {
        return response.status(404).json({
            message: "Invalid project id"
        })
    }

    const query = `
        SELECT 
            *
        FROM
            projects
        WHERE
            id = $1
    `
    const queryConfig: QueryConfig = {
        text: query,
        values: [projectId]
    }
    const queryResult = await client.query(queryConfig)

    if(queryResult.rowCount === 0) {
        return response.status(404).json({
            message: "Project not found."
        })
    }
    
    return next()
}

const checkPosibleKeysUpdateProject = (request: Request, response: Response, next: NextFunction) => {
    const requestKeys = Object.keys(request.body)
    const posibleKeys = [
        "name",
        "description",
        "estimatedTime",
        "repository",
        "startDate",
        "endDate",
        "developerId"
    ]
    let hasPosibleKeys = posibleKeys.some( pK => {
        return requestKeys.includes(pK)
    })
    
    if(!hasPosibleKeys) {
        return response.status(400).json({
            message: "At least one of those keys must be send.",
            keys: `${posibleKeys}`
        })
    }

    return next()
}

const removeExtraKeysProjectUpdate = (request: Request, response: Response, next: NextFunction) => {

    const posibleKeys = [
        "name",
        "description",
        "estimatedTime",
        "repository",
        "startDate",
        "endDate",
        "developerId"
    ]

    let newBody : IProject = {}
    
    Object.keys(request.body).forEach(key => {
        if (posibleKeys.includes(key as string)) {
            newBody[key as keyof IProject] = request.body[key];
        }
    })

    request.body = newBody

    next()
}

const removeExtraKeysTechnology = (request: Request, response: Response, next: NextFunction) => {
    request.body = {
        name: request.body.name
    }

    return next()
}

const checkPosibleValuesTechnologies = (request: Request, response: Response, next: NextFunction) => {
    const posibleValues = [
        "JAVASCRIPT",
        "PYTHON",
        "REACT",
        "EXPRESS.JS",
        "HTML",
        "CSS",
        "DJANGO",
        "POSTGRESQL",
        "MONGODB"
    ]
    const requestValue = request.method === "POST" ? request.body.name : request.params.name
    
    if(typeof requestValue !== "string") {
        return response.status(400).json({
            message: "Invalid technology name"
        })
    }

    if(!posibleValues.includes(requestValue.toUpperCase())) {
        return response.status(400).json({
            message: "Technology not supported.",
            options: [
                "JavaScript",
                "Python",
                "React",
                "Express.js",
                "HTML",
                "CSS",
                "Django",
                "PostgreSQL",
                "MongoDB"
            ]
        })
    }
    return next()
}

const checkIfTechIsInProject = async (request: Request, response: Response, next: NextFunction) => {
    const projectId = request.params.id
    const techName = request.params.name
    const query = `
        SELECT 
            t.id AS "technologyId"	
        FROM 
            projects p 
        LEFT JOIN  projects_technologies pt  ON  pt."projectId" = p.id 
        LEFT JOIN technologies t ON pt."technologyId" = t.id
        WHERE 
            t.name = $1 AND p.id = $2;
    `
    const queryConfig: QueryConfig = {
        text: query, 
        values: [techName.toUpperCase(), projectId]
    }
    const queryResult = await client.query(queryConfig)
    
    if(queryResult.rowCount === 0) {
        return response.status(404).json({
            message: `Technology ${techName} not found on thin Project.`
        })
    }

    return next()
}

export {
    removeExtraKeysProject,
    checkRequiredKeysProjects,
    checkIfProjectExists,
    checkPosibleKeysUpdateProject,
    removeExtraKeysProjectUpdate,
    removeExtraKeysTechnology,
    checkPosibleValuesTechnologies,
    checkIfTechIsInProject
}