import { gql } from "@apollo/client";

export const PROJECTS_QUERY = gql`
  query Projects($pagination: ProjectsPaginationDto) {
    projects(pagination: $pagination) {
      items {
        id
        title
        thumbnailUrl
        createdAt
        updatedAt
      }
      total
      page
      totalPages
    }
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectDto!) {
    createProject(input: $input) {
      id
      title
      updatedAt
    }
  }
`;

export const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!) {
    project(id: $id) {
      id
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export const RESOLVE_SHARE_LINK_QUERY = gql`
  query ResolveShareLink($token: String!) {
    resolveShareLink(token: $token) {
      token
      role
      canEdit
      project {
        id
        userId
        title
        width
        height
        content
        createdAt
        updatedAt
      }
    }
  }
`;

export const AUTOSAVE_SHARED_PROJECT_MUTATION = gql`
  mutation AutosaveSharedProject($token: String!, $content: JSON!) {
    autosaveSharedProject(token: $token, content: $content) {
      id
      updatedAt
    }
  }
`;

export const AUTOSAVE_PROJECT_MUTATION = gql`
  mutation AutosaveProject($id: ID!, $content: JSON!) {
    autosaveProject(id: $id, content: $content) {
      id
      updatedAt
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectDto!) {
    updateProject(id: $id, input: $input) {
      id
      title
      updatedAt
      content
    }
  }
`;

export const VERSIONS_QUERY = gql`
  query Versions($projectId: ID!) {
    versions(projectId: $projectId) {
      id
      label
      createdAt
    }
  }
`;

export const CREATE_VERSION_MUTATION = gql`
  mutation CreateVersion($projectId: ID!, $label: String) {
    createVersion(projectId: $projectId, label: $label) {
      id
      label
      createdAt
    }
  }
`;

export const RESTORE_VERSION_MUTATION = gql`
  mutation RestoreVersion($projectId: ID!, $versionId: ID!) {
    restoreVersion(projectId: $projectId, versionId: $versionId) {
      id
      title
      content
      updatedAt
    }
  }
`;

export const EXPORT_PNG_MUTATION = gql`
  mutation ExportPng($projectId: ID!) {
    exportPng(projectId: $projectId) {
      url
      fileName
      mimeType
    }
  }
`;

export const CREATE_SHARE_LINK_MUTATION = gql`
  mutation CreateShareLink($projectId: ID!, $expiresInHours: Float, $role: ShareLinkRole) {
    createShareLink(projectId: $projectId, expiresInHours: $expiresInHours, role: $role) {
      url
      token
      role
      expiresAt
    }
  }
`;

export const PROJECT_SHARE_LINKS_QUERY = gql`
  query ProjectShareLinks($projectId: ID!) {
    projectShareLinks(projectId: $projectId) {
      token
      role
      isRevoked
      expiresAt
      createdAt
    }
  }
`;

export const UPDATE_SHARE_LINK_ROLE_MUTATION = gql`
  mutation UpdateShareLinkRole($token: String!, $role: ShareLinkRole!) {
    updateShareLinkRole(token: $token, role: $role) {
      token
      role
    }
  }
`;

export const REVOKE_SHARE_LINK_MUTATION = gql`
  mutation RevokeShareLink($token: String!) {
    revokeShareLink(token: $token)
  }
`;
