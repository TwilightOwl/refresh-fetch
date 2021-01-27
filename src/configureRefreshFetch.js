// @flow

type Configuration = {
  refreshToken: () => Promise<void>,
  shouldRefreshToken: (error: any) => boolean,
  fetch: (url: any, options: Object) => Promise<any>,
  minimumRefreshPeriod?: number
}

function configureRefreshFetch (configuration: Configuration) {
  const { refreshToken, shouldRefreshToken, fetch, minimumRefreshPeriod = 90000 } = configuration

  let refreshingTokenPromise = null
  let lastRefreshTime = Number.NEGATIVE_INFINITY

  return (url: any, options: Object) => {
    if (refreshingTokenPromise !== null) {
      return (
        refreshingTokenPromise
          .then(() => fetch(url, options))
          // Even if the refreshing fails, do the fetch so we reject with
          // error of that request
          .catch(() => fetch(url, options))
      )
    }

    return fetch(url, options).catch(error => {
      if (shouldRefreshToken(error)) {
        const timeFromLastRefresh = Date.now() - lastRefreshTime
        if (timeFromLastRefresh > minimumRefreshPeriod) {
          lastRefreshTime = Date.now()
          refreshingTokenPromise = new Promise((resolve, reject) => {
            refreshToken()
              .then(() => {
                resolve()
              })
              .catch(refreshTokenError => {
                reject(refreshTokenError)
              })
          })
        }

        return refreshingTokenPromise
          .catch(() => {
            // If refreshing fails, continue with original error
            throw error
          })
          .then(() => fetch(url, options))
      } else {
        throw error
      }
    })
  }
}

export default configureRefreshFetch
